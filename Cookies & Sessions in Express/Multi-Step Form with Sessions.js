const express = require("express")
const session = require("express-session")
const bodyParser = require("body-parser")

const app = express()

// Middleware
app.use(bodyParser.urlencoded({ extended: true }))
app.use(session({
  secret: "secret-key",
  resave: false,
  saveUninitialized: true
}))

// -----------------------------
// Step 1 (Basic Info)
// -----------------------------
app.get("/", (req, res) => {
  res.send(`
    <h2>Step 1: Basic Info</h2>
    <form method="POST" action="/step1">
      Name: <input name="name" required /><br/><br/>
      Email: <input type="email" name="email" required /><br/><br/>
      <button type="submit">Next</button>
    </form>
  `)
})

app.post("/step1", (req, res) => {
  req.session.user = {
    name: req.body.name,
    email: req.body.email
  }
  res.redirect("/step2")
})

// -----------------------------
// Step 2 (Additional Info)
// -----------------------------
app.get("/step2", (req, res) => {
  res.send(`
    <h2>Step 2: Additional Info</h2>
    <form method="POST" action="/step2">
      Age: <input type="number" name="age" required /><br/><br/>
      City: <input name="city" required /><br/><br/>
      <button type="submit">Next</button>
    </form>
  `)
})

app.post("/step2", (req, res) => {
  req.session.user.age = req.body.age
  req.session.user.city = req.body.city
  res.redirect("/summary")
})

// -----------------------------
// Final Summary
// -----------------------------
app.get("/summary", (req, res) => {
  const user = req.session.user || {}

  res.send(`
    <h2>Registration Summary</h2>
    <p><b>Name:</b> ${user.name}</p>
    <p><b>Email:</b> ${user.email}</p>
    <p><b>Age:</b> ${user.age}</p>
    <p><b>City:</b> ${user.city}</p>
  `)
})

// -----------------------------
// Start Server
// -----------------------------
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000")
})