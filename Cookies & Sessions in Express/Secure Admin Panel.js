const express = require("express")
const session = require("express-session")
const bodyParser = require("body-parser")

const app = express()
app.use(bodyParser.urlencoded({ extended: true }))

app.use(session({
  secret: "secret-key",
  resave: false,
  saveUninitialized: true
}))

// -----------------------------
// Dummy Users (with roles)
// -----------------------------
const users = [
  { email: "admin@gmail.com", password: "123", role: "admin" },
  { email: "user@gmail.com", password: "123", role: "user" }
]

// -----------------------------
// Middleware: Authentication
// -----------------------------
const isAuthenticated = (req, res, next) => {
  if (req.session.user) return next()
  res.redirect("/login")
}

// -----------------------------
// Middleware: Role Check
// -----------------------------
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === "admin") {
    return next()
  }
  res.send("Access Denied ❌ (Admin Only)")
}

// -----------------------------
// Login Page
// -----------------------------
app.get("/login", (req, res) => {
  res.send(`
    <h2>Login</h2>
    <form method="POST" action="/login">
      Email: <input name="email" /><br/><br/>
      Password: <input type="password" name="password" /><br/><br/>
      <button type="submit">Login</button>
    </form>
  `)
})

// Handle Login
app.post("/login", (req, res) => {
  const { email, password } = req.body

  const user = users.find(u => u.email === email && u.password === password)

  if (!user) return res.send("Invalid credentials ❌")

  req.session.user = user
  res.redirect("/dashboard")
})

// -----------------------------
// Dashboard (All Logged-in Users)
// -----------------------------
app.get("/dashboard", isAuthenticated, (req, res) => {
  res.send(`
    <h2>Welcome ${req.session.user.email}</h2>
    <p>Role: ${req.session.user.role}</p>
    <a href="/admin">Go to Admin Panel</a><br/><br/>
    <a href="/logout">Logout</a>
  `)
})

// -----------------------------
// Admin Panel (Admin Only)
// -----------------------------
app.get("/admin", isAuthenticated, isAdmin, (req, res) => {
  res.send(`
    <h2>Admin Panel 🔐</h2>
    <p>Only admins can see this</p>
  `)
})

// -----------------------------
// Logout
// -----------------------------
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login")
  })
})

// -----------------------------
// Start Server
// -----------------------------
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000")
})