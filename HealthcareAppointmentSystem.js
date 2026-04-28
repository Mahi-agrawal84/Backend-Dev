// ================== IMPORTS ==================
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const validator = require('validator');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');

// ================== APP ==================
const app = express();
app.use(express.json());

// ================== DB ==================
mongoose.connect('mongodb://127.0.0.1:27017/medibook')
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));

// ================== MODELS ==================
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: { type: String, enum: ['patient','doctor','nurse','admin','insurance'] },
    medicalHistory: String
});

const recordSchema = new mongoose.Schema({
    patientId: mongoose.Schema.Types.ObjectId,
    doctorId: mongoose.Schema.Types.ObjectId,
    notes: String,
    prescription: String
});

const appointmentSchema = new mongoose.Schema({
    patientId: mongoose.Schema.Types.ObjectId,
    doctorId: mongoose.Schema.Types.ObjectId,
    date: Date,
    reason: String
});

const auditSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    action: String,
    timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Record = mongoose.model('Record', recordSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);
const Audit = mongoose.model('Audit', auditSchema);

// ================== SECURITY ==================
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());

// ================== SESSION ==================
app.use(session({
    secret: 'medibook-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: 'mongodb://127.0.0.1:27017/medibook',
        ttl: 15 * 60 // 15 min (healthcare strict)
    }),
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 15
    }
}));

// ================== HELPERS ==================
function encrypt(text){
    const cipher = crypto.createCipher('aes-256-cbc','secretkey');
    return cipher.update(text,'utf8','hex') + cipher.final('hex');
}

function decrypt(text){
    const decipher = crypto.createDecipher('aes-256-cbc','secretkey');
    return decipher.update(text,'hex','utf8') + decipher.final('utf8');
}

function logAction(userId, action){
    Audit.create({ userId, action });
}

// ================== AUTH ==================
function isAuth(req,res,next){
    if(!req.session.user) return res.status(401).json({message:"Unauthorized"});
    next();
}

function requireRole(roles){
    return (req,res,next)=>{
        if(!roles.includes(req.session.user.role)){
            return res.status(403).json({message:"Forbidden"});
        }
        next();
    }
}

// ================== VALIDATION ==================
function validatePatient(data){
    if(!validator.isEmail(data.email)) return "Invalid email";
    if(!validator.isLength(data.password,{min:8})) return "Weak password";
    if(!validator.isDate(data.dob)) return "Invalid DOB";
    return null;
}

// ================== FILE UPLOAD ==================
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req,file,cb)=>{
        const allowed = ['application/pdf','image/jpeg','image/png'];
        if(!allowed.includes(file.mimetype)){
            return cb(new Error("Invalid file type"));
        }
        cb(null,true);
    }
});

// ================== ROUTES ==================

// 🔹 REGISTER
app.post('/register', async (req,res)=>{
    const error = validatePatient(req.body);
    if(error) return res.status(400).json({message:error});

    const hash = await bcrypt.hash(req.body.password,10);

    const user = await User.create({
        name: validator.escape(req.body.name),
        email: req.body.email,
        password: hash,
        role: req.body.role,
        medicalHistory: encrypt(req.body.medicalHistory || "")
    });

    res.json({message:"Registered"});
});

// 🔹 LOGIN
app.post('/login', async (req,res)=>{
    const user = await User.findOne({ email: req.body.email });
    if(!user) return res.status(401).json({message:"Invalid credentials"});

    const match = await bcrypt.compare(req.body.password, user.password);
    if(!match) return res.status(401).json({message:"Invalid credentials"});

    req.session.user = { id:user._id, role:user.role };
    res.json({message:"Login success"});
});

// 🔹 CREATE RECORD (Doctor only)
app.post('/records', isAuth, requireRole(['doctor']), async (req,res)=>{
    const record = await Record.create({
        patientId: req.body.patientId,
        doctorId: req.session.user.id,
        notes: validator.escape(req.body.notes),
        prescription: validator.escape(req.body.prescription)
    });

    logAction(req.session.user.id, "Created record");
    res.json(record);
});

// 🔹 VIEW RECORD (Owner only)
app.get('/records/:id', isAuth, async (req,res)=>{
    const record = await Record.findById(req.params.id);

    if(!record) return res.status(404).json({message:"Not found"});

    if(
        record.patientId.toString() !== req.session.user.id &&
        record.doctorId.toString() !== req.session.user.id &&
        req.session.user.role !== 'admin'
    ){
        return res.status(403).json({message:"Forbidden"});
    }

    logAction(req.session.user.id, "Viewed record");

    res.json({
        ...record.toObject(),
        notes: validator.escape(record.notes)
    });
});

// 🔹 APPOINTMENT
app.post('/appointments', isAuth, async (req,res)=>{
    if(!validator.isISO8601(req.body.date)){
        return res.status(400).json({message:"Invalid date"});
    }

    const appt = await Appointment.create({
        patientId: req.session.user.id,
        doctorId: req.body.doctorId,
        date: new Date(req.body.date),
        reason: validator.escape(req.body.reason)
    });

    res.json(appt);
});

// 🔹 SEARCH (Protected + sanitized)
app.get('/patients', isAuth, requireRole(['doctor','admin']), async (req,res)=>{
    const q = req.query.q || "";

    const users = await User.find({
        name: { $regex: new RegExp(q,'i') }
    }).limit(10);

    res.json(users);
});

// 🔹 FILE UPLOAD
app.post('/upload', isAuth, upload.single('file'), (req,res)=>{
    const buffer = fs.readFileSync(req.file.path);

    if(buffer.includes("MZ")){
        fs.unlinkSync(req.file.path);
        return res.status(400).json({message:"Malicious file"});
    }

    logAction(req.session.user.id, "Uploaded document");
    res.json({message:"Uploaded securely"});
});

// ================== SERVER ==================
app.listen(3000, ()=> console.log("🚀 MediBook Secure Server running"));