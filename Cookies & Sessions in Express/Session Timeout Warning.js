const express = require("express")
const session = require("express-session")

const app = express()

// -----------------------------
// Session Config (Short for demo)
// -----------------------------
app.use(session({
  secret: "secret-key",
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 60 * 1000 // 1 minute session
  }
}))

// -----------------------------
// Home Page with Warning Script
// -----------------------------
app.get("/", (req, res) => {
  res.send(`
    <h2>Welcome User</h2>
    <p>Your session will expire soon ⏳</p>

    <script>
      // Session timeout = 60 sec
      const sessionTime = 60000
      const warningTime = 45000 // warn at 45 sec

      setTimeout(() => {
        alert("⚠️ Your session will expire in 15 seconds!")
      }, warningTime)

      setTimeout(() => {
        alert("❌ Session expired! Please login again.")
        window.location.href = "/login"
      }, sessionTime)
    </script>
  `)
})

// -----------------------------
// Login Page (Dummy)
// -----------------------------
app.get("/login", (req, res) => {
  res.send("<h2>Login Page</h2>")
})

// -----------------------------
// Start Server
// -----------------------------
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000")
})