const fs = require("fs");
const path = require("path");

// Get command-line arguments
const [, , command, ...args] = process.argv;

switch (command) {
  case "read":
    readFile(args[0]);
    break;

  case "write":
    writeFile(args[0], args.slice(1).join(" "));
    break;

  case "copy":
    copyFile(args[0], args[1]);
    break;

  case "delete":
    deleteFile(args[0]);
    break;

  case "list":
    listDirectory(args[0] || ".");
    break;

  default:
    showHelp();
}

//  Read File
function readFile(filePath) {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return console.error("Error reading file:", err.message);
    console.log("\nFile Content:\n", data);
  });
}

// Write File
function writeFile(filePath, content) {
  fs.writeFile(filePath, content, (err) => {
    if (err) return console.error("Error writing file:", err.message);
    console.log("File written successfully!");
  });
}

// Copy File
function copyFile(source, destination) {
  fs.copyFile(source, destination, (err) => {
    if (err) return console.error("Error copying file:", err.message);
    console.log("File copied successfully!");
  });
}

// Delete File
function deleteFile(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) return console.error("Error deleting file:", err.message);
    console.log("File deleted successfully!");
  });
}

//  List Directory Contents
function listDirectory(dirPath) {
  fs.readdir(dirPath, (err, files) => {
    if (err) return console.error("Error reading directory:", err.message);
    console.log("\nDirectory Contents:");
    files.forEach(file => console.log(file));
  });
}

//  Help Menu
function showHelp() {
  console.log(`
File Manager CLI Commands:

node fileManager.js read <file>
node fileManager.js write <file> <content>
node fileManager.js copy <source> <destination>
node fileManager.js delete <file>
node fileManager.js list <directory>
`);
}
