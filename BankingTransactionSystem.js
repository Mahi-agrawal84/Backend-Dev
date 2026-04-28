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
const crypto = require('crypto');
const speakeasy = require('speakeasy');

// ================== APP ==================
const app = express();
app.use(express.json());

// ================== DB ==================
mongoose.connect('mongodb://127.0.0.1:27017/quickbank')
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));

// ================== MODELS ==================
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    balance: Number,
    accountNumber: String,
    failedAttempts: { type:Number, default:0 },
    lockUntil: Date,
    resetToken: String,
    resetExpires: Date,
    mfaSecret: String
});

const transactionSchema = new mongoose.Schema({
    from: mongoose.Schema.Types.ObjectId,
    to: mongoose.Schema.Types.ObjectId,
    amount: Number,
    description: String,
    timestamp: { type: Date, default: Date.now }
});

const auditSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    action: String,
    meta: Object,
    time: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const Audit = mongoose.model('Audit', auditSchema);

// ================== SECURITY ==================
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());

// ================== SESSION ==================
app.use(session({
    secret: 'bank-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: 'mongodb://127.0.0.1:27017/quickbank',
        ttl: 15 * 60
    }),
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 15
    }
}));

// ================== RATE LIMIT ==================
const loginLimiter = rateLimit({ windowMs:15*60*1000, max:5 });
const transferLimiter = rateLimit({ windowMs:1*60*1000, max:3 });

app.use('/login', loginLimiter);
app.use('/transfer', transferLimiter);

// ================== HELPERS ==================
function log(userId, action, meta={}){
    Audit.create({ userId, action, meta });
}

function generateToken(){
    return crypto.randomBytes(32).toString('hex');
}

// ================== AUTH ==================
function isAuth(req,res,next){
    if(!req.session.user) return res.status(401).json({message:"Unauthorized"});
    next();
}

// ================== REGISTER ==================
app.post('/register', async (req,res)=>{
    const { email, password } = req.body;

    if(!validator.isEmail(email))
        return res.status(400).json({message:"Invalid email"});

    if(password.length < 8)
        return res.status(400).json({message:"Weak password"});

    const hash = await bcrypt.hash(password,10);

    const mfaSecret = speakeasy.generateSecret().base32;

    const user = await User.create({
        email,
        password: hash,
        balance: 1000,
        accountNumber: crypto.randomBytes(6).toString('hex'),
        mfaSecret
    });

    res.json({message:"Registered"});
});

// ================== LOGIN ==================
app.post('/login', async (req,res)=>{
    const user = await User.findOne({ email: req.body.email });

    if(!user) return res.status(401).json({message:"Invalid credentials"});

    if(user.lockUntil && Date.now() < user.lockUntil){
        return res.status(403).json({message:"Account locked"});
    }

    const match = await bcrypt.compare(req.body.password, user.password);

    if(!match){
        user.failedAttempts++;
        if(user.failedAttempts >=5){
            user.lockUntil = Date.now()+30*60*1000;
        }
        await user.save();
        return res.status(401).json({message:"Invalid credentials"});
    }

    user.failedAttempts = 0;
    await user.save();

    req.session.user = { id:user._id };

    log(user._id, "login");
    res.json({message:"Login success"});
});

// ================== TRANSFER ==================
app.post('/transfer', isAuth, async (req,res)=>{
    let { toAccount, amount, description, token } = req.body;

    const user = await User.findById(req.session.user.id);
    const receiver = await User.findOne({ accountNumber: toAccount });

    if(!receiver) return res.status(400).json({message:"Invalid account"});

    if(amount <=0 || amount > 100000)
        return res.status(400).json({message:"Invalid amount"});

    // 2FA for large transactions
    if(amount > 1000){
        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token
        });
        if(!verified) return res.status(401).json({message:"2FA required"});
    }

    if(user.balance < amount)
        return res.status(400).json({message:"Insufficient balance"});

    // sanitize description
    description = validator.escape(description);

    user.balance -= amount;
    receiver.balance += amount;

    await user.save();
    await receiver.save();

    await Transaction.create({
        from: user._id,
        to: receiver._id,
        amount,
        description
    });

    log(user._id, "transfer", { amount });

    res.json({message:"Transfer successful"});
});

// ================== TRANSACTION HISTORY ==================
app.get('/transactions', isAuth, async (req,res)=>{
    const tx = await Transaction.find({ from: req.session.user.id });
    res.json(tx);
});

// ================== PASSWORD RESET ==================
app.post('/reset-request', async (req,res)=>{
    const user = await User.findOne({ email:req.body.email });
    if(!user) return res.json({message:"If exists, email sent"});

    const token = generateToken();
    user.resetToken = token;
    user.resetExpires = Date.now() + 15*60*1000;
    await user.save();

    res.json({message:"Reset link generated"});
});

app.post('/reset-password', async (req,res)=>{
    const user = await User.findOne({
        resetToken:req.body.token,
        resetExpires: { $gt: Date.now() }
    });

    if(!user) return res.status(400).json({message:"Invalid token"});

    user.password = await bcrypt.hash(req.body.password,10);
    user.resetToken = null;
    user.resetExpires = null;

    await user.save();

    res.json({message:"Password updated"});
});

// ================== PROFILE UPDATE ==================
app.put('/profile', isAuth, async (req,res)=>{
    const updates = {};

    if(req.body.email && validator.isEmail(req.body.email)){
        updates.email = req.body.email;
    }

    const user = await User.findByIdAndUpdate(
        req.session.user.id,
        updates,
        { new:true }
    );

    res.json(user);
});

// ================== ERROR HANDLER ==================
app.use((err,req,res,next)=>{
    console.error(err);
    res.status(500).json({message:"Something went wrong"});
});

// ================== SERVER ==================
app.listen(3000, ()=> console.log("🚀 QuickBank Secure Server running"));