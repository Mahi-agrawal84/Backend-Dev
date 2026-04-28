// ================== IMPORTS ==================
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const validator = require('validator');
const sanitizeHtml = require('sanitize-html');
const multer = require('multer');
const fs = require('fs');
const morgan = require('morgan');
const speakeasy = require('speakeasy'); // MFA (TOTP)

// ================== APP INIT ==================
const app = express();
app.use(express.json());
app.use(morgan('dev')); // logging

// ================== DB ==================
mongoose.connect('mongodb://127.0.0.1:27017/edulearn')
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// ================== MODELS ==================
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    role: { type: String, enum: ['student','instructor','admin'] },
    mfaSecret: String
});

const courseSchema = new mongoose.Schema({
    title: String,
    description: String,
    instructorId: mongoose.Schema.Types.ObjectId
});

const quizSchema = new mongoose.Schema({
    question: String,
    answer: String
});

const submissionSchema = new mongoose.Schema({
    studentId: mongoose.Schema.Types.ObjectId,
    quizId: mongoose.Schema.Types.ObjectId,
    answer: String,
    locked: { type: Boolean, default: true }
});

const messageSchema = new mongoose.Schema({
    from: mongoose.Schema.Types.ObjectId,
    to: mongoose.Schema.Types.ObjectId,
    text: String
});

const User = mongoose.model('User', userSchema);
const Course = mongoose.model('Course', courseSchema);
const Quiz = mongoose.model('Quiz', quizSchema);
const Submission = mongoose.model('Submission', submissionSchema);
const Message = mongoose.model('Message', messageSchema);

// ================== SECURITY ==================
app.use(helmet());

// CSP (S3 video, Stripe, analytics, embeds)
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://js.stripe.com", "https://analytics.example.com"],
        imgSrc: ["'self'", "https://s3.amazonaws.com"],
        mediaSrc: ["https://s3.amazonaws.com"],
        frameSrc: ["https://www.youtube.com"],
        connectSrc: ["'self'", "https://api.stripe.com"]
    }
}));

app.use(mongoSanitize());
app.use(xss());

// ================== SESSION ==================
app.use(session({
    secret: 'edulearn-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: 'mongodb://127.0.0.1:27017/edulearn',
        ttl: 60 * 60
    }),
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60
    }
}));

// ================== RATE LIMIT ==================
const loginLimiter = rateLimit({ windowMs: 15*60*1000, max: 5 });
const quizLimiter = rateLimit({ windowMs: 1*60*1000, max: 10 });

app.use('/login', loginLimiter);
app.use('/quiz', quizLimiter);

// ================== HELPERS ==================
function sanitizeRichText(input) {
    return sanitizeHtml(input, {
        allowedTags: ['b','i','em','strong','a','ul','li'],
        allowedAttributes: { a: ['href'] }
    });
}

function cleanText(input) {
    return validator.escape(input);
}

// ================== AUTH ==================
function isAuth(req,res,next){
    if(!req.session.user) return res.status(401).json({message:"Unauthorized"});
    next();
}

function requireRole(role){
    return (req,res,next)=>{
        if(req.session.user.role !== role && req.session.user.role !== 'admin'){
            return res.status(403).json({message:"Forbidden"});
        }
        next();
    }
}

// ================== FILE UPLOAD ==================
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error("Only PDF allowed"));
        }
        cb(null, true);
    }
});

// ================== ROUTES ==================

// 🔹 REGISTER
app.post('/register', async (req,res)=>{
    let { email, password, role } = req.body;

    if(!validator.isEmail(email))
        return res.status(400).json({message:"Invalid email"});

    if(password.length < 8)
        return res.status(400).json({message:"Weak password"});

    const hash = await bcrypt.hash(password,10);

    let mfaSecret = null;
    if(role === 'instructor'){
        const secret = speakeasy.generateSecret();
        mfaSecret = secret.base32;
    }

    const user = await User.create({ email, password: hash, role, mfaSecret });

    res.json({ message:"Registered", mfaSetup: mfaSecret ? "Use authenticator app" : null });
});

// 🔹 LOGIN (+ MFA for instructors)
app.post('/login', async (req,res)=>{
    const { email, password, token } = req.body;

    const user = await User.findOne({ email });
    if(!user) return res.status(401).json({message:"Invalid credentials"});

    const match = await bcrypt.compare(password, user.password);
    if(!match) return res.status(401).json({message:"Invalid credentials"});

    // MFA check
    if(user.role === 'instructor'){
        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token
        });
        if(!verified) return res.status(401).json({message:"Invalid MFA token"});
    }

    req.session.user = { id:user._id, role:user.role };
    res.json({message:"Login success"});
});

// 🔹 CREATE COURSE
app.post('/courses', isAuth, requireRole('instructor'), async (req,res)=>{
    let { title, description } = req.body;
    description = sanitizeRichText(description);

    const course = await Course.create({
        title: cleanText(title),
        description,
        instructorId: req.session.user.id
    });

    res.json(course);
});

// 🔹 VIEW MY COURSES ONLY (fix leak)
app.get('/courses', isAuth, async (req,res)=>{
    const courses = await Course.find({ instructorId: req.session.user.id });
    res.json(courses);
});

// 🔹 QUIZ SUBMIT (locked)
app.post('/quiz/submit', isAuth, async (req,res)=>{
    const { quizId, answer } = req.body;

    const submission = await Submission.create({
        studentId: req.session.user.id,
        quizId,
        answer: cleanText(answer),
        locked: true
    });

    res.json(submission);
});

// 🔹 PREVENT MODIFICATION
app.put('/quiz/submit/:id', isAuth, async (req,res)=>{
    const sub = await Submission.findById(req.params.id);

    if(sub.locked){
        return res.status(403).json({message:"Submission locked"});
    }

    res.json({message:"Updated"});
});

// 🔹 MESSAGE
app.post('/messages', isAuth, async (req,res)=>{
    let { to, text } = req.body;

    const msg = await Message.create({
        from: req.session.user.id,
        to,
        text: cleanText(text)
    });

    res.json(msg);
});

// 🔹 FILE UPLOAD (PDF only)
app.post('/upload', isAuth, upload.single('file'), (req,res)=>{
    // basic scan (reject executable signature)
    const fileBuffer = fs.readFileSync(req.file.path);

    if(fileBuffer.includes("MZ")){ // exe signature
        fs.unlinkSync(req.file.path);
        return res.status(400).json({message:"Malicious file detected"});
    }

    res.json({message:"File uploaded safely"});
});

// ================== ERROR HANDLER ==================
app.use((err,req,res,next)=>{
    res.status(500).json({message:err.message});
});

// ================== SERVER ==================
app.listen(3000, ()=> console.log("🚀 EduLearn Secure Server running"));