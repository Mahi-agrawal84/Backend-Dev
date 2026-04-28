const express = require('express');
const session = require('express-session');

const app = express();
app.use(express.json());

app.use(session({
    secret: 'auth-secret',
    resave: false,
    saveUninitialized: false
}));

// In-memory storage
const users = [];
const posts = [];

// 🔹 Authentication Middleware
const isAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized: Please login" });
    }
    next();
};

// 🔹 Role-Based Authorization Middleware
const requireRole = (role) => {
    return (req, res, next) => {
        const user = req.session.user;

        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Admin can access everything
        if (user.role === 'admin') {
            return next();
        }

        if (user.role !== role) {
            return res.status(403).json({
                message: `Forbidden: Requires ${role} role`
            });
        }

        next();
    };
};

// 🔹 Ownership OR Moderator/Admin Check
const isOwnerOrModerator = (req, res, next) => {
    const user = req.session.user;
    const postId = req.params.id;

    const post = posts.find(p => p.id === parseInt(postId));

    if (!post) {
        return res.status(404).json({ message: "Post not found" });
    }

    // Owner
    if (post.userId === user.id) {
        req.post = post;
        return next();
    }

    // Moderator or Admin
    if (user.role === 'moderator' || user.role === 'admin') {
        req.post = post;
        return next();
    }

    return res.status(403).json({
        message: "Forbidden: You can only modify your own posts"
    });
};

// 🔹 Create Post (User+)
app.post('/posts', isAuthenticated, (req, res) => {
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ message: "Content is required" });
    }

    const newPost = {
        id: posts.length + 1,
        content,
        userId: req.session.user.id
    };

    posts.push(newPost);

    res.status(201).json({
        message: "Post created",
        post: newPost
    });
});

// 🔹 Update Post
app.put('/posts/:id', isAuthenticated, isOwnerOrModerator, (req, res) => {
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ message: "Content is required" });
    }

    req.post.content = content;

    res.json({
        message: "Post updated",
        post: req.post
    });
});

// 🔹 Delete Post (Moderator+)
app.delete('/posts/:id', isAuthenticated, requireRole('moderator'), (req, res) => {
    const postId = parseInt(req.params.id);

    const index = posts.findIndex(p => p.id === postId);

    if (index === -1) {
        return res.status(404).json({ message: "Post not found" });
    }

    posts.splice(index, 1);

    res.json({
        message: "Post deleted"
    });
});

// 🔹 OPTIONAL: Dummy login route for testing
app.post('/login', (req, res) => {
    const { id, role } = req.body;

    if (!id || !role) {
        return res.status(400).json({ message: "id and role required" });
    }

    req.session.user = { id, role };

    res.json({
        message: "Logged in",
        user: req.session.user
    });
});

// 🔹 OPTIONAL: Logout
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: "Logged out" });
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});