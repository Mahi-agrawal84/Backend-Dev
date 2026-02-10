const express = require("express");
const fs = require("fs").promises;
const app = express();
app.use(express.json());

app.use((req,res,next) =>{
  console.log("I am middleware 1");
  next()
})

app.use((req,res,next)=>{
  console.log("I am middleware 2");
  next()
})

// authMiddleware
const authMiddleware = (req, res, next) => {
  console.log("Auth middleware executed");

  const token = req.headers["authorization"];
  console.log("Token received:", token);

  if (!token) {
    return res.status(401).json({ msg: "Access denied.No token provided" });
  }

  if (token !== "Bearer mysecrettoken") {
    return res.status(403).json({ msg: "Invalid token" });
  }

  console.log("Auth successful");
  next();
};
module.exports = authMiddleware;


//  logger middleware
const loggerFile = async (req, res, next) => {
  const log = `Request at: ${new Date().toLocaleString()} | Method: ${req.method}\n`;

  try {
    await fs.appendFile("log.txt", log);
    console.log("log written");
  } catch (err) {
    console.log("file error:", err);
  }

  next();
};

//  route
app.get("/students", authMiddleware, loggerFile, (req, res) => {
  console.log("students route executed");
  res.status(200).json({ msg: "students route hit" });
});

//  server
const PORT = 8000;
app.listen(PORT, () => {
  console.log("Server running on port 8000");
});
