// ================== IMPORTS ==================
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const validator = require('validator');
const sanitizeHtml = require('sanitize-html');

// ================== APP INIT ==================
const app = express();
app.use(express.json());

// ================== DB ==================
mongoose.connect('mongodb://127.0.0.1:27017/connecthub')
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

// ================== MODELS ==================
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    bio: String,
    profilePic: String,
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const postSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    content: String
});

const messageSchema = new mongoose.Schema({
    from: mongoose.Schema.Types.ObjectId,
    to: mongoose.Schema.Types.ObjectId,
    text: String
});

const commentSchema = new mongoose.Schema({
    postId: mongoose.Schema.Types.ObjectId,
    userId: mongoose.Schema.Types.ObjectId,
    text: String
});

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);
const Message = mongoose.model('Message', messageSchema);
const Comment = mongoose.model('Comment', commentSchema);

// ================== SECURITY ==================

// Helmet
app.use(helmet());

// CORS (web + mobile)
app.use(cors({
    origin: ['http://localhost:3000', 'https://yourmobileapp.com'],
    credentials: true
}));

// Prevent Mongo Injection
app.use(mongoSanitize());

// Prevent XSS
app.use(xss());

// ================== SESSION ==================
app.use(session({
    secret: 'connecthub-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: 'mongodb://127.0.0.1:27017/connecthub',
        ttl: 60 * 60 // 1 hour
    }),
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 60 // 1 hour
    }
}));

// ================== SANITIZATION HELPERS ==================

// Allow limited HTML (safe formatting only)
function sanitizePostHTML(input) {
    return sanitizeHtml(input, {
        allowedTags: ['b', 'i', 'em', 'strong', 'a'],
        allowedAttributes: {
            a: ['href']
        },
        allowedSchemes: ['http', 'https']
    });
}

// General text sanitize
function cleanText(input) {
    return validator.escape(input.trim());
}

// Validate URL
function validateURL(url) {
    return validator.isURL(url, {
        protocols: ['http', 'https'],
        require_protocol: true
    });
}

// ================== GLOBAL VALIDATION MIDDLEWARE ==================
function validateRequest(req, res, next) {
    try {
        for (let key in req.body) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim();
            }
        }
        next();
    } catch (err) {
        return res.status(400).json({ message: "Invalid input" });
    }
}

app.use(validateRequest);

// ================== AUTH ==================
function isAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    next();
}

// ================== ROUTES ==================

// 🔹 REGISTER
app.post('/register', async (req, res) => {
    let { username, email, password, bio, profilePic } = req.body;

    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid email" });
    }

    if (!validateURL(profilePic)) {
        return res.status(400).json({ message: "Invalid profile URL" });
    }

    username = cleanText(username);
    bio = cleanText(bio);

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
        username,
        email,
        password: hashed,
        bio,
        profilePic
    });

    await user.save();
    res.json({ message: "User registered" });
});

// 🔹 LOGIN
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    req.session.user = { id: user._id };
    res.json({ message: "Login success" });
});

// 🔹 CREATE POST (safe HTML allowed)
app.post('/posts', isAuth, async (req, res) => {
    let { content } = req.body;

    content = sanitizePostHTML(content);

    const post = await Post.create({
        userId: req.session.user.id,
        content
    });

    res.json(post);
});

// 🔹 GET POSTS
app.get('/posts', async (req, res) => {
    const posts = await Post.find();
    res.json(posts);
});

// 🔹 COMMENT
app.post('/comments', isAuth, async (req, res) => {
    let { text, postId } = req.body;

    text = cleanText(text);

    const comment = await Comment.create({
        text,
        postId,
        userId: req.session.user.id
    });

    res.json(comment);
});

// 🔹 DIRECT MESSAGE (protected)
app.post('/messages', isAuth, async (req, res) => {
    let { to, text } = req.body;

    text = cleanText(text);

    const msg = await Message.create({
        from: req.session.user.id,
        to,
        text
    });

    res.json(msg);
});

// 🔹 GET MY MESSAGES ONLY (fix data leak)
app.get('/messages', isAuth, async (req, res) => {
    const msgs = await Message.find({
        $or: [
            { from: req.session.user.id },
            { to: req.session.user.id }
        ]
    });

    res.json(msgs);
});

// 🔹 FOLLOW USER
app.post('/follow/:id', isAuth, async (req, res) => {
    const user = await User.findById(req.params.id);

    user.followers.push(req.session.user.id);
    await user.save();

    res.json({ message: "Followed" });
});

// ================== SERVER ==================
app.listen(3000, () => {
    console.log("🚀 ConnectHub Secure Server running");
});