const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")

const app = express()
app.use(bodyParser.json())

// -----------------------------
// Connect MongoDB
// -----------------------------
mongoose.connect("mongodb://127.0.0.1:27017/softDeleteDB")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err))

// -----------------------------
// Schema with Soft Delete Field
// -----------------------------
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
})

// -----------------------------
// Mongoose Middleware
// -----------------------------

// Automatically filter out deleted documents
function excludeDeleted(next) {
  this.where({ isDeleted: false })
  next()
}

// Apply middleware to queries
userSchema.pre("find", excludeDeleted)
userSchema.pre("findOne", excludeDeleted)
userSchema.pre("findOneAndUpdate", excludeDeleted)

// -----------------------------
// Model
// -----------------------------
const User = mongoose.model("User", userSchema)

// -----------------------------
// Routes
// -----------------------------

// Create User
app.post("/users", async (req, res) => {
  const user = await User.create(req.body)
  res.json(user)
})

// Get All Users (deleted users hidden automatically)
app.get("/users", async (req, res) => {
  const users = await User.find()
  res.json(users)
})

// Soft Delete User
app.delete("/users/:id", async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      isDeleted: true,
      deletedAt: new Date()
    },
    { new: true }
  )

  res.json({ message: "User soft deleted", user })
})

// Restore User
app.put("/users/restore/:id", async (req, res) => {
  const user = await mongoose.model("User").findOneAndUpdate(
    { _id: req.params.id },
    { isDeleted: false, deletedAt: null },
    { new: true }
  )

  res.json({ message: "User restored", user })
})

// View Deleted Users (override filter)
app.get("/deleted-users", async (req, res) => {
  const users = await mongoose.model("User").find({ isDeleted: true })
  res.json(users)
})

// -----------------------------
// Start Server
// -----------------------------
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000")
})