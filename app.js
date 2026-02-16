const express = require("express");
const path = require("path");
const app = express();

// ================= MIDDLEWARE =================

// Body parser
app.use(express.urlencoded({ extended: true }));

// Static folder
app.use(express.static("public"));

// Response Time Middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${duration}ms`);
  });

  next();
});

// Set EJS
app.set("view engine", "ejs");

// ================= ROUTES =================

// Root Route
app.get("/", (req, res) => {
  res.send("Welcome to My Express + EJS Project 🚀");
});

// ================= USERS FILTER =================

const users = [
  { id: 1, name: "Mahi" },
  { id: 2, name: "Riya" },
  { id: 3, name: "Anushka" }
];

app.get("/users", (req, res) => {
  const name = req.query.name;

  let filteredUsers = users;

  if (name) {
    filteredUsers = users.filter(user =>
      user.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  res.json(filteredUsers);
});

// ================= CONTACT FORM =================

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.post("/contact", (req, res) => {
  const { name, email, message } = req.body;
  console.log("Contact Form Data:", name, email, message);
  res.send("Form Submitted Successfully ✅");
});

// ================= GALLERY =================

app.get("/gallery", (req, res) => {
  const images = ["img1.jpg", "img2.jpg"]; // Make sure these exist
  res.render("gallery", { images });
});

// ================= BLOG =================

let posts = [
  { id: 1, title: "First Post", content: "This is my first blog post." }
];

// List all posts
app.get("/blog", (req, res) => {
  res.render("blog", { posts });
});

// View single post
app.get("/blog/:id", (req, res) => {
  const post = posts.find(p => p.id == req.params.id);

  if (!post) {
    return res.send("Post not found ❌");
  }

  res.render("post", { post });
});

// Form to create new post
app.get("/new-post", (req, res) => {
  res.render("newPost");
});

// Create new post
app.post("/new-post", (req, res) => {
  const { title, content } = req.body;

  const newPost = {
    id: posts.length + 1,
    title,
    content
  };

  posts.push(newPost);

  res.redirect("/blog");
});

// ================= 404 PAGE =================

app.use((req, res) => {
  res.status(404).render("404");
});

// ================= SERVER =================

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
