const express = require('express');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

// Dummy users (password = "password123" hashed)
const users = [
    {
        email: "john@example.com",
        password: bcrypt.hashSync("password123", 10)
    }
];

// email -> { count, firstAttemptTime, lockUntil }
const loginAttempts = new Map();

const MAX_ATTEMPTS = 5;
const WINDOW_TIME = 60 * 60 * 1000; // 1 hour
const LOCK_TIME = 30 * 60 * 1000;   // 30 minutes

// 🔹 Check login attempts
function checkLoginAttempts(email) {
    const data = loginAttempts.get(email);

    if (!data) return { allowed: true };

    const now = Date.now();

    // Check if account is locked
    if (data.lockUntil && now < data.lockUntil) {
        return {
            allowed: false,
            message: `Account locked. Try again after ${Math.ceil((data.lockUntil - now) / 60000)} minutes`
        };
    }

    // Reset if window expired
    if (data.firstAttemptTime && now - data.firstAttemptTime > WINDOW_TIME) {
        loginAttempts.delete(email);
        return { allowed: true };
    }

    // Check attempt count
    if (data.count >= MAX_ATTEMPTS) {
        data.lockUntil = now + LOCK_TIME;
        return {
            allowed: false,
            message: "Too many failed attempts. Account locked for 30 minutes"
        };
    }

    return { allowed: true };
}

// 🔹 Record failed attempt
function recordFailedAttempt(email) {
    const now = Date.now();
    let data = loginAttempts.get(email);

    if (!data) {
        data = {
            count: 1,
            firstAttemptTime: now,
            lockUntil: null
        };
    } else {
        data.count += 1;
    }

    // Lock if exceeded attempts
    if (data.count >= MAX_ATTEMPTS) {
        data.lockUntil = now + LOCK_TIME;
    }

    loginAttempts.set(email, data);
}

// 🔹 Clear attempts (on success)
function clearAttempts(email) {
    loginAttempts.delete(email);
}

// 🔹 LOGIN ROUTE
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password required"
        });
    }

    // Check rate limit / lock
    const check = checkLoginAttempts(email);
    if (!check.allowed) {
        return res.status(429).json({
            message: check.message
        });
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        recordFailedAttempt(email);
        return res.status(401).json({
            message: "Invalid email or password"
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        recordFailedAttempt(email);
        return res.status(401).json({
            message: "Invalid email or password"
        });
    }

    // Success → clear attempts
    clearAttempts(email);

    res.json({
        message: "Login successful"
    });
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});