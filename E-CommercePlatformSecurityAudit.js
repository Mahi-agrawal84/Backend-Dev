// ================== IMPORTS ==================
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const bcrypt = require('bcrypt');

// ================== APP INIT ==================
const app = express();
app.use(express.json());

// ================== DB CONNECT ==================
mongoose.connect('mongodb://127.0.0.1:27017/shopeasy', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// ================== MODELS ==================
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    role: { type: String, default: 'user' }
});

const productSchema = new mongoose.Schema({
    name: String,
    price: { type: Number, min: 0 } // prevents negative price
});

const reviewSchema = new mongoose.Schema({
    review: String
});

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Review = mongoose.model('Review', reviewSchema);

// ================== SECURITY MIDDLEWARE ==================

// Helmet (CSP configured for CDN + YouTube + payments)
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://www.youtube.com"],
        imgSrc: ["'self'", "https://cdn.shopeasy.com"],
        frameSrc: ["https://www.youtube.com"],
        connectSrc: ["'self'", "https://api.paymentgateway.com"]
    }
}));

// Prevent MongoDB Injection
app.use(mongoSanitize());

// Prevent XSS
app.use(xss());

// ================== SESSION (MongoStore) ==================
app.use(session({
    secret: 'super-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: 'mongodb://127.0.0.1:27017/shopeasy',
        collectionName: 'sessions',
        ttl: 24 * 60 * 60
    }),
    cookie: {
        httpOnly: true,
        secure: false, // set true in HTTPS
        maxAge: 1000 * 60 * 30 // 30 min
    }
}));

// ================== RATE LIMIT ==================
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many login attempts. Try again later."
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100
});

app.use('/login', loginLimiter);
app.use('/api', apiLimiter);

// ================== AUTH MIDDLEWARE ==================
function isAuthenticated(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    next();
}

// ================== ROUTES ==================

// 🔹 Register
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({ email, password: hashed });
    await user.save();

    res.json({ message: "User registered" });
});

// 🔹 Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    req.session.user = {
        id: user._id,
        email: user.email,
        role: user.role
    };

    res.json({ message: "Login successful" });
});

// 🔹 Search Products (Safe)
app.get('/search', async (req, res) => {
    const q = req.query.q || "";

    const products = await Product.find({
        name: { $regex: new RegExp(q, 'i') },
        price: { $gte: 0 }
    });

    res.json(products);
});

// 🔹 Add Product (for testing)
app.post('/products', async (req, res) => {
    const { name, price } = req.body;

    if (price < 0) {
        return res.status(400).json({ message: "Invalid price" });
    }

    const product = new Product({ name, price });
    await product.save();

    res.json(product);
});

// 🔹 Submit Review (XSS Safe)
app.post('/reviews', isAuthenticated, async (req, res) => {
    let { review } = req.body;

    if (!review) {
        return res.status(400).json({ message: "Review required" });
    }

    // extra escaping
    review = review.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    await Review.create({ review });

    res.json({ message: "Review submitted safely" });
});

// 🔹 Protected Route
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.json({
        message: "Welcome to dashboard",
        user: req.session.user
    });
});

// ================== SERVER ==================
app.listen(3000, () => {
    console.log("🚀 Server running on port 3000");
});