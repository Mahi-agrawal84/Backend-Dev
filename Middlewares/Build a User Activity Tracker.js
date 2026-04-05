const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")

const app = express()
app.use(bodyParser.json())

// -----------------------------
// Connect MongoDB
// -----------------------------
mongoose.connect("mongodb://127.0.0.1:27017/activityDB")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err))

// -----------------------------
// User Schema
// -----------------------------
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  loginTime: Date,
  logoutTime: Date,
  lastActive: Date
})

// -----------------------------
// Mongoose Middleware
// -----------------------------

// Before saving (login tracking)
userSchema.pre("save", function (next) {
  if (!this.loginTime) {
    this.loginTime = new Date()
  }
  this.lastActive = new Date()
  next()
})

// Before update (update last active)
userSchema.pre("findOneAndUpdate", function (next) {
  this.set({ lastActive: new Date() })
  next()
})

// -----------------------------
// Model
// -----------------------------
const User = mongoose.model("User", userSchema)

// -----------------------------
// Routes
// -----------------------------

// User Login
app.post("/login", async (req, res) => {
  const { name, email } = req.body

  let user = await User.findOne({ email })

  if (!user) {
    user = new User({ name, email })
  }

  user.loginTime = new Date()
  user.lastActive = new Date()

  await user.save()

  res.json({ message: "User logged in", user })
})

// Update Activity
app.put("/activity/:email", async (req, res) => {
  const user = await User.findOneAndUpdate(
    { email: req.params.email },
    {}, // no manual update needed, middleware handles it
    { new: true }
  )

  res.json({ message: "Activity updated", user })
})

// User Logout
app.post("/logout", async (req, res) => {
  const { email } = req.body

  const user = await User.findOneAndUpdate(
    { email },
    { logoutTime: new Date() },
    { new: true }
  )

  res.json({ message: "User logged out", user })
})

// View All Users
app.get("/users", async (req, res) => {
  const users = await User.find()
  res.json(users)
})

// -----------------------------
// Start Server
// -----------------------------
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000")
})