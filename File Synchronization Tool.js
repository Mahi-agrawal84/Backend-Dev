const fs = require("fs");
const path = require("path");

const sourceDir = "./source";
const targetDir = "./target";

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function syncDirectories(src, dest) {
  try {
    const files = fs.readdirSync(src);

    files.forEach((file) => {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);

      const srcStat = fs.statSync(srcPath);

      // If directory → recursive sync
      if (srcStat.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath);
        }
        syncDirectories(srcPath, destPath);
      } 
      // If file → copy or update
      else {
        if (!fs.existsSync(destPath)) {
          copyFile(srcPath, destPath, "Copied");
        } else {
          const destStat = fs.statSync(destPath);
          if (srcStat.mtime > destStat.mtime) {
            copyFile(srcPath, destPath, "Updated");
          }
        }
      }
    });
  } catch (err) {
    console.error("Error syncing directories:", err.message);
  }
}

// Copy file with error handling
function copyFile(src, dest, action) {
  try {
    fs.copyFileSync(src, dest);
    console.log(`${action}: ${dest}`);
  } catch (err) {
    console.error(`Failed to copy ${src}:`, err.message);
  }
}

// Start sync
syncDirectories(sourceDir, targetDir);

console.log("\n File synchronization completed.");
