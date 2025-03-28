
#  Cleanser

  

A VSCode extension that helps you remove comments and console logs from your code files. This extension supports JavaScript, TypeScript, React, CSS, HTML, and Python files.

   
  <br>


##  Features

  

- Remove comments from various file types

- Remove both comments and logs at once

- Works on single files or all files in the workspace

- Preserves code structure and formatting

- Undo changes per file using VSCode's undo functionality

    <br>


##  Usage

  

###  Working on a Single File

  

1. Open the file you want to process

2. Right-click in the editor

3. Choose one of these options:

	- "Remove Comments (Current File)"

	- "Remove Console Logs (Current File)"

	- "Remove Comments and Logs (Current File)"

  <br>

###  Working on All Files

  

1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux) to open the command palette

2. Type one of these commands:

	- "Remove Comments (All Files)"

	- "Remove Console Logs (All Files)"

	- "Remove Comments and Logs (All Files)"

    <br>


##  Example

  

###  Before:

  

```javascript

// This is a test function

function  example()  {

// This is a comment inside a function

console.log('This is a test log');

/* This is a multi-line

comment */

console.debug('Debug message');

// Another comment

    return  true;

}

```

  <br>

###  After:

  

```javascript

function  example()  {

    return  true;

}

```

   <br>


##  Contributing

  

I appreciate all contributions, feel free to submit a pull request!

Check out the repository [here](https://github.com/saadpocalypse/cleanser).

  <br>

##  License

  

This extension is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.