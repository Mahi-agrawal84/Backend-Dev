const express = require("express")
const cookieParser = require("cookie-parser")

const app = express()
app.use(cookieParser())

// -----------------------------
// Language Data
// -----------------------------
const messages = {
  en: "Hello, Welcome!",
  hi: "नमस्ते, स्वागत है!",
  fr: "Bonjour, Bienvenue!"
}

// -----------------------------
// Middleware to Get Language
// -----------------------------
app.use((req, res, next) => {
  const lang = req.cookies.language || "en"
  req.language = lang
  next()
})

// -----------------------------
// Home Route
// -----------------------------
app.get("/", (req, res) => {
  const message = messages[req.language] || messages["en"]

  res.send(`
    <h2>${message}</h2>
    <p>Select Language:</p>
    <a href="/set-language/en">English</a> |
    <a href="/set-language/hi">Hindi</a> |
    <a href="/set-language/fr">French</a>
  `)
})

// -----------------------------
// Set Language Cookie
// -----------------------------
app.get("/set-language/:lang", (req, res) => {
  const lang = req.params.lang

  res.cookie("language", lang, {
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })

  res.redirect("/")
})

// -----------------------------
// Start Server
// -----------------------------
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000")
})