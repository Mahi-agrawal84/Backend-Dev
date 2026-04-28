const express = require('express');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

const users = [];

// Password validation function
function validatePassword(password) {
    const errors = [];

    if (password.length < 8) {
        errors.push("Password must be at least 8 characters long");
    }

    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter");
    }

    if (!/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter");
    }

    if (!/[0-9]/.test(password)) {
        errors.push("Password must contain at least one number");
    }

    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
        errors.push("Password must contain at least one special character");
    }

    return errors;
}

// Registration endpoint
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check missing fields
        if (!username || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // Check duplicate email
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        // Validate password
        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
            return res.status(400).json({
                message: "Password validation failed",
                errors: passwordErrors
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Store user
        const newUser = {
            username,
            email,
            password: hashedPassword
        };

        users.push(newUser);

        return res.status(201).json({
            message: "User registered successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});