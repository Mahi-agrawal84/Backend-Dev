const express = require("express")
const jwt = require("jsonwebtoken")
const bodyParser = require("body-parser")

const app = express()
app.use(bodyParser.json())

const SECRET_KEY = "secret-key"

// Dummy OTP store (in real apps use DB/Redis)
let otpStore = {}

// -----------------------------
// Generate JWT Token (Login)
// -----------------------------
app.post("/login", (req, res) => {
  const { email } = req.body

  const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: "1h" })

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  otpStore[email] = otp

  console.log(`OTP for ${email}: ${otp}`) // simulate sending OTP

  res.json({ message: "Login successful. OTP sent.", token })
})

// -----------------------------
// Middleware: Verify JWT
// -----------------------------
const verifyJWT = (req, res, next) => {
  const token = req.headers["authorization"]

  if (!token) return res.status(401).json({ message: "Token missing" })

  try {
    const decoded = jwt.verify(token, SECRET_KEY)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" })
  }
}

// -----------------------------
// Middleware: Verify OTP
// -----------------------------
const verifyOTP = (req, res, next) => {
  const { otp } = req.body
  const email = req.user.email

  if (otpStore[email] !== otp) {
    return res.status(401).json({ message: "Invalid OTP" })
  }

  next()
}

// -----------------------------
// Protected Route (MFA Required)
// -----------------------------
app.post("/secure-action", verifyJWT, verifyOTP, (req, res) => {
  res.json({ message: "Sensitive operation successful ✅" })
})

// -----------------------------
// Start Server
// -----------------------------
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000")
})