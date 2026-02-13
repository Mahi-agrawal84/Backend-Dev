const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 8000;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const dataPath = path.join(__dirname, "students.json");

// Function to read students
function getStudents() {
  const data = fs.readFileSync(dataPath);
  return JSON.parse(data);
}

// Function to save students
function saveStudents(students) {
  fs.writeFileSync(dataPath, JSON.stringify(students, null, 2));
}

// Home Page
app.get("/", (req, res) => {
  res.render("home");
});

// Add Student
app.post("/add", (req, res) => {
  const { name, branch } = req.body;
  const students = getStudents();

  const newStudent = {
    id: Date.now(),
    name,
    branch
  };

  students.push(newStudent);
  saveStudents(students);

  res.redirect("/students");
});

// Show Students
app.get("/students", (req, res) => {
  let students = getStudents();

  const branchFilter = req.query.branch;

  if (branchFilter) {
    students = students.filter(
      (student) => student.branch === branchFilter
    );
  }

  res.render("students", {
    students,
    total: students.length,
    selectedBranch: branchFilter
  });
});

// Delete Student
app.get("/students/delete/:id", (req, res) => {
  const id = parseInt(req.params.id);
  let students = getStudents();

  students = students.filter(student => student.id !== id);

  saveStudents(students);
  res.redirect("/students");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
