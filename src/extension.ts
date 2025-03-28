import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    let removeComments = vscode.commands.registerCommand('cleanser.removeComments', async () => {
        await processFiles('comments');
    });

    let removeLogs = vscode.commands.registerCommand('cleanser.removeLogs', async () => {
        await processFiles('logs');
    });

    let removeBoth = vscode.commands.registerCommand('cleanser.removeBoth', async () => {
        await processFiles('both');
    });

    let removeCommentsInFile = vscode.commands.registerCommand('cleanser.removeCommentsInFile', async () => {
        await processCurrentFile('comments');
    });

    let removeLogsInFile = vscode.commands.registerCommand('cleanser.removeLogsInFile', async () => {
        await processCurrentFile('logs');
    });

    let removeBothInFile = vscode.commands.registerCommand('cleanser.removeBothInFile', async () => {
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
                const commentStartIndex = line.indexOf('/*');
                const commentEndIndex = line.indexOf('*/');
                
                if (commentStartIndex !== -1 && commentEndIndex !== -1 && commentEndIndex > commentStartIndex) {
                    shouldKeep = false;
                }
                else if (commentStartIndex !== -1) {
                    inMultiLineComment = true;
                    shouldKeep = false;
                }
                else if (commentEndIndex !== -1) {
                    inMultiLineComment = false;
                    shouldKeep = false;
                }
                else if (inMultiLineComment) {
                    shouldKeep = false;
                }
                break;

            case '.html':
                const htmlCommentStartIndex = line.indexOf('<!--');
                const htmlCommentEndIndex = line.indexOf('-->');
                
                if (htmlCommentStartIndex !== -1 && htmlCommentEndIndex !== -1 && htmlCommentEndIndex > htmlCommentStartIndex) {
                    shouldKeep = false;
                }
                else if (htmlCommentStartIndex !== -1) {
                    inMultiLineComment = true;
                    shouldKeep = false;
                }
                else if (htmlCommentEndIndex !== -1) {
                    inMultiLineComment = false;
                    shouldKeep = false;
                }
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

        if (shouldKeep) {
            result.push(line);
        }
    }

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
                if (trimmedLine.match(/^\s*console\.(log|debug|info|warn|error)\s*\(/)) {
                    shouldKeep = false;
                }
                break;
            case '.py':
                if (trimmedLine.match(/^\s*print\s*\(/)) {
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