const express = require("express")
const session = require("express-session")
const cookieParser = require("cookie-parser")
const bodyParser = require("body-parser")

const app = express()
app.use(bodyParser.json())
app.use(cookieParser())

app.use(session({
  secret: "secret-key",
  resave: false,
  saveUninitialized: true
}))

// -----------------------------
// Helper: Get Cart
// -----------------------------
const getCart = (req) => {
  // Logged-in user → session cart
  if (req.session.user) {
    if (!req.session.cart) req.session.cart = []
    return req.session.cart
  }

  // Anonymous user → cookie cart
  let cart = req.cookies.cart ? JSON.parse(req.cookies.cart) : []
  return cart
}

// -----------------------------
// Helper: Save Cart
// -----------------------------
const saveCart = (req, res, cart) => {
  if (req.session.user) {
    req.session.cart = cart
  } else {
    res.cookie("cart", JSON.stringify(cart), {
      maxAge: 7 * 24 * 60 * 60 * 1000
    })
  }
}

// -----------------------------
// Add to Cart
// -----------------------------
app.post("/add", (req, res) => {
  const { item } = req.body
  let cart = getCart(req)

  cart.push(item)
  saveCart(req, res, cart)

  res.json({ message: "Item added", cart })
})

// -----------------------------
// View Cart
// -----------------------------
app.get("/cart", (req, res) => {
  const cart = getCart(req)
  res.json(cart)
})

// -----------------------------
// Login (Simulated)
// -----------------------------
app.post("/login", (req, res) => {
  req.session.user = { email: "user@gmail.com" }

  // Migrate cart from cookies → session
  const cookieCart = req.cookies.cart ? JSON.parse(req.cookies.cart) : []

  if (!req.session.cart) req.session.cart = []

  req.session.cart = [...req.session.cart, ...cookieCart]

  // Clear cookie cart after migration
  res.clearCookie("cart")

  res.json({ message: "Logged in & cart migrated", cart: req.session.cart })
})

// -----------------------------
// Logout
// -----------------------------
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" })
  })
})

// -----------------------------
// Start Server
// -----------------------------
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000")
})