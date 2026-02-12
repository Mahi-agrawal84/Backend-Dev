const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Home route
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/form.html");
});

// Register student
app.post("/students/register", (req, res) => {
    const newStudent = req.body;

    const filePath = path.join(__dirname, "students.json");

    // Read existing data
    fs.readFile(filePath, "utf8", (err, data) => {
        let students = [];

        if (!err && data) {
            students = JSON.parse(data);
        }

        // Add new student
        students.push(newStudent);

        // Write updated data
        fs.writeFile(filePath, JSON.stringify(students, null, 2), (err) => {
            if (err) {
                return res.send("Error saving data");
            }

            console.log("Student Registered:", newStudent);
            res.send("Student Registered Successfully ");
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});