const express = require("express")
const fs = require("fs")
const path = require("path")

const app = express()

// Log file path
const logFilePath = path.join(__dirname, "requests.log")

// -----------------------------
// Logging Middleware
// -----------------------------
app.use((req, res, next) => {
  const start = Date.now()

  res.on("finish", () => {
    const end = Date.now()
    const responseTime = end - start

    const log = `${new Date().toISOString()} | ${req.method} | ${req.url} | ${res.statusCode} | ${responseTime}ms\n`

    fs.appendFile(logFilePath, log, (err) => {
      if (err) console.error("Error writing log:", err)
    })
  })

  next()
})

// -----------------------------
// Sample Routes
// -----------------------------
app.get("/", (req, res) => {
  res.send("Home Page")
})

app.get("/about", (req, res) => {
  res.send("About Page")
})

// -----------------------------
// Start Server
// -----------------------------
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000")
})