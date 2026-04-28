const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const session = require('express-session');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Session setup
app.use(session({
    secret: 'passport-secret',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

const JWT_SECRET = 'jwt-secret';

// Dummy users
const users = [
    { id: 1, username: 'john', password: '1234' }
];

// 🔹 Serialize / Deserialize (for session)
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    const user = users.find(u => u.id === id);
    done(null, user || false);
});

// 🔹 Local Strategy (username/password)
passport.use('local', new LocalStrategy(
    { usernameField: 'username', passwordField: 'password' },
    async (username, password, done) => {
        try {
            const user = users.find(u => u.username === username);

            if (!user) {
                return done(null, false, { message: "User not found" });
            }

            if (user.password !== password) {
                return done(null, false, { message: "Invalid password" });
            }

            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
));

// 🔹 JWT Strategy
passport.use('jwt', new JwtStrategy(
    {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: JWT_SECRET
    },
    (payload, done) => {
        try {
            const user = users.find(u => u.id === payload.id);

            if (!user) {
                return done(null, false);
            }

            return done(null, user);
        } catch (err) {
            return done(err, false);
        }
    }
));

// 🔹 SESSION LOGIN (Local Strategy)
app.post('/auth/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).json({ message: "Server error" });
        }

        if (!user) {
            return res.status(401).json({
                message: info.message || "Login failed"
            });
        }

        req.login(user, (err) => {
            if (err) {
                return res.status(500).json({ message: "Login error" });
            }

            res.json({
                message: "Logged in with session",
                user: { id: user.id, username: user.username }
            });
        });
    })(req, res, next);
});

// 🔹 API LOGIN (returns JWT)
app.post('/auth/api-login', (req, res, next) => {
    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err) {
            return res.status(500).json({ message: "Server error" });
        }

        if (!user) {
            return res.status(401).json({
                message: info.message || "Login failed"
            });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: "Logged in with JWT",
            token
        });
    })(req, res, next);
});

// 🔹 Middleware: Check session auth
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ message: "Unauthorized (session)" });
}

// 🔹 Protected Route (Session)
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.json({
        message: "Welcome to dashboard",
        user: req.user
    });
});

// 🔹 Protected Route (JWT)
app.get('/api/profile',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        res.json({
            message: "JWT protected profile",
            user: req.user
        });
    }
);

// 🔹 Logout (session)
app.post('/auth/logout', (req, res) => {
    req.logout(() => {
        res.json({ message: "Logged out" });
    });
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});