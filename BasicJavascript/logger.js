// logger.js
const fs = require("fs");

function logActivity(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${message} - ${timestamp}\n`;

  fs.appendFile("activity.log", logMessage, (err) => {
    if (err) {
      console.error("Error writing to log file:", err);
    }
  });
}

module.exports = { logActivity };