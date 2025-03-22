import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    // All files commands
    let removeComments = vscode.commands.registerCommand('comment-and-log-remover.removeComments', async () => {
        await processFiles('comments');
    });

    let removeLogs = vscode.commands.registerCommand('comment-and-log-remover.removeLogs', async () => {
        await processFiles('logs');
    });

    let removeBoth = vscode.commands.registerCommand('comment-and-log-remover.removeBoth', async () => {
        await processFiles('both');
    });

    // Single file commands
    let removeCommentsInFile = vscode.commands.registerCommand('comment-and-log-remover.removeCommentsInFile', async () => {
        await processCurrentFile('comments');
    });

    let removeLogsInFile = vscode.commands.registerCommand('comment-and-log-remover.removeLogsInFile', async () => {
        await processCurrentFile('logs');
    });

    let removeBothInFile = vscode.commands.registerCommand('comment-and-log-remover.removeBothInFile', async () => {
        await processCurrentFile('both');
    });

    context.subscriptions.push(
        removeComments,
        removeLogs,
        removeBoth,
        removeCommentsInFile,
        removeLogsInFile,
        removeBothInFile
    );
}

async function processCurrentFile(mode: 'comments' | 'logs' | 'both') {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
    }

    const document = editor.document;
    const fileExtension = path.extname(document.fileName).toLowerCase();
    
    let newContent = document.getText();
    let originalContent = newContent;

    if (mode === 'comments' || mode === 'both') {
        newContent = removeCommentsFromFile(newContent, fileExtension);
    }
    if (mode === 'logs' || mode === 'both') {
        newContent = removeLogsFromFile(newContent, fileExtension);
    }

    if (newContent !== originalContent) {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), newContent);
        await vscode.workspace.applyEdit(edit);
        vscode.window.showInformationMessage('Modified current file');
    }
}

async function processFiles(mode: 'comments' | 'logs' | 'both') {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder found');
        return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const files = await getAllFiles(rootPath);
    let modifiedCount = 0;

    for (const file of files) {
        const uri = vscode.Uri.file(file);
        const document = await vscode.workspace.openTextDocument(uri);
        const fileExtension = path.extname(file).toLowerCase();
        
        let newContent = document.getText();
        let originalContent = newContent;

        if (mode === 'comments' || mode === 'both') {
            newContent = removeCommentsFromFile(newContent, fileExtension);
        }
        if (mode === 'logs' || mode === 'both') {
            newContent = removeLogsFromFile(newContent, fileExtension);
        }

        if (newContent !== originalContent) {
            const edit = new vscode.WorkspaceEdit();
            edit.replace(uri, new vscode.Range(0, 0, document.lineCount, 0), newContent);
            await vscode.workspace.applyEdit(edit);
            modifiedCount++;
        }
    }

    vscode.window.showInformationMessage(`Modified ${modifiedCount} files`);
}

async function getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
            if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
                files.push(...await getAllFiles(fullPath));
            }
        } else {
            const ext = path.extname(entry.name).toLowerCase();
            if (['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.py'].includes(ext)) {
                files.push(fullPath);
            }
        }
    }

    return files;
}

function removeCommentsFromFile(content: string, fileExtension: string): string {
    const lines = content.split('\n');
    const result: string[] = [];
    let inMultiLineComment = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        let shouldKeep = true;

        switch (fileExtension) {
            case '.js':
            case '.jsx':
            case '.ts':
            case '.tsx':
                // Handle multi-line comments
                if (trimmedLine.startsWith('/*')) {
                    inMultiLineComment = true;
                    shouldKeep = false;
                } else if (trimmedLine.includes('*/')) {
                    inMultiLineComment = false;
                    shouldKeep = false;
                } else if (inMultiLineComment) {
                    shouldKeep = false;
                } else if (trimmedLine.startsWith('//')) {
                    shouldKeep = false;
                }
                break;

            case '.css':
                // Handle multi-line comments
                const commentStartIndex = line.indexOf('/*');
                const commentEndIndex = line.indexOf('*/');
                
                // If this line contains a complete comment (both start and end)
                if (commentStartIndex !== -1 && commentEndIndex !== -1 && commentEndIndex > commentStartIndex) {
                    shouldKeep = false;
                }
                // If this line starts a comment
                else if (commentStartIndex !== -1) {
                    inMultiLineComment = true;
                    shouldKeep = false;
                }
                // If this line ends a comment
                else if (commentEndIndex !== -1) {
                    inMultiLineComment = false;
                    shouldKeep = false;
                }
                // If we're inside a comment
                else if (inMultiLineComment) {
                    shouldKeep = false;
                }
                break;

            case '.html':
                // Handle HTML comments
                const htmlCommentStartIndex = line.indexOf('<!--');
                const htmlCommentEndIndex = line.indexOf('-->');
                
                // If this line contains a complete comment (both start and end)
                if (htmlCommentStartIndex !== -1 && htmlCommentEndIndex !== -1 && htmlCommentEndIndex > htmlCommentStartIndex) {
                    shouldKeep = false;
                }
                // If this line starts a comment
                else if (htmlCommentStartIndex !== -1) {
                    inMultiLineComment = true;
                    shouldKeep = false;
                }
                // If this line ends a comment
                else if (htmlCommentEndIndex !== -1) {
                    inMultiLineComment = false;
                    shouldKeep = false;
                }
                // If we're inside a comment
                else if (inMultiLineComment) {
                    shouldKeep = false;
                }
                break;

            case '.py':
                if (trimmedLine.startsWith('#')) {
                    shouldKeep = false;
                }
                break;
        }

        // Keep the line if it's not a comment
        if (shouldKeep) {
            result.push(line);
        }
    }

    // Join lines and clean up multiple consecutive empty lines
    let cleanedResult = result.join('\n');
    cleanedResult = cleanedResult.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    return cleanedResult;
}

function removeLogsFromFile(content: string, fileExtension: string): string {
    const lines = content.split('\n');
    const result: string[] = [];

    for (const line of lines) {
        const trimmedLine = line.trim();
        let shouldKeep = true;

        switch (fileExtension) {
            case '.js':
            case '.jsx':
            case '.ts':
            case '.tsx':
                if (trimmedLine.match(/^console\.(log|debug|info|warn|error)\((.*?)\);?$/)) {
                    shouldKeep = false;
                }
                break;
            case '.py':
                if (trimmedLine.match(/^print\((.*?)\)$/)) {
                    shouldKeep = false;
                }
                break;
        }

        if (shouldKeep) {
            result.push(line);
        }
    }

    return result.join('\n');
}

export function deactivate() {} 