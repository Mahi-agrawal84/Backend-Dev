const express = require("express")
const bodyParser = require("body-parser")

const app = express()
app.use(bodyParser.json())

// -----------------------------
// Sanitization Function
// -----------------------------
const sanitizeInput = (input) => {
  if (typeof input === "string") {
    return input
      .replace(/</g, "&lt;")   // prevent HTML tags
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/;/g, "")       // basic SQL injection prevention
      .replace(/--/g, "")
  } else if (typeof input === "object" && input !== null) {
    // Recursively sanitize object
    for (let key in input) {
      input[key] = sanitizeInput(input[key])
    }
  }
  return input
}

// -----------------------------
// Middleware
// -----------------------------
const sanitizeMiddleware = (req, res, next) => {
  if (req.body) req.body = sanitizeInput(req.body)
  if (req.query) req.query = sanitizeInput(req.query)
  if (req.params) req.params = sanitizeInput(req.params)

  next()
}

// Apply middleware globally
app.use(sanitizeMiddleware)

// -----------------------------
// Sample Route
// -----------------------------
app.post("/submit", (req, res) => {
  res.json({
    message: "Sanitized Data Received",
    data: req.body
  })
})

// -----------------------------
// Start Server
// -----------------------------
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000")
})