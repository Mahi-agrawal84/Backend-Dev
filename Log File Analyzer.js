const fs = require("fs");
const readline = require("readline");

const logFilePath = "app.log";

// Statistics object
const stats = {
  totalLines: 0,
  info: 0,
  warn: 0,
  error: 0,
};

// Create read stream
const readStream = fs.createReadStream(logFilePath, {
  encoding: "utf8",
});

// Read file line by line using streams
const rl = readline.createInterface({
  input: readStream,
  crlfDelay: Infinity,
});

rl.on("line", (line) => {
  stats.totalLines++;

  if (line.includes("ERROR")) stats.error++;
  else if (line.includes("WARN")) stats.warn++;
  else if (line.includes("INFO")) stats.info++;
});

rl.on("close", () => {
  generateReport();
});

// Generate summary report
function generateReport() {
  console.log("\n Log File Analysis Report");
  console.log(" ");
  console.log("Total Log Entries:", stats.totalLines);
  console.log("INFO Logs :", stats.info);
  console.log("WARN Logs :", stats.warn);
  console.log("ERROR Logs:", stats.error);

  const errorRate = ((stats.error / stats.totalLines) * 100).toFixed(2);
  console.log("Error Rate :", errorRate + "%");
}
