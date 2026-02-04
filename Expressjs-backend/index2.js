// const express= require("express");

// const app = express();

// const PORT = 8000;

// app.use(express.json())
// const students = [
//     { id: 1, name: "mahi", branch: "CSE"},
//     { id: 2, name: "anushka", branch: "ECE"},
//     { id: 3, name: "chhavi", branch: "IT"},
//     { id: 4, name: "gracy", branch: "CSE"},

// ];

// app.get("/", (req,res)=>{
//     res.send("Welcome to home page")
// });

// app.get("/students/search",(req,res)=>{
//     const branch = req.query.branch;
//     console.log("branch",branch);
//     console.log("branch",branch);
//     if(!branch){
//         return res.json(students);
//     }
//     const foundstudents= students.filter(s=>s.branch==branch);
//     res.json(foundstudents);
// });

// app.get("/students",(req,res) => {
//     res.json(students); 
// });

// app.get("/students/:id",(req,res)=>{
//     const id = req.params.id;

//     const arrayIndex = students.findIndex(s=>s.id==id);
//      if(arrayIndex<0){
//         return res.status(404).send("student not found");
//     }

//     const foundStudent = students[arrayIndex];
//     res.json(foundStudent); 


// });
 
// app.post("/students/register", async (req,res)=>{
//     const data=req.body;
//     students.push(data)
//     res.json(students)
// })

// app.listen(PORT, ()=>{
//     console.log(`Server is Running on port:${PORT}`);
//  })

const express=require("express");
const fs =require("fs");
const app=express();
app.use(express.json());
const PORT =8000;
const students = JSON.parse(fs.readFileSync("./db.json", "utf-8"));
app.get("/",(req,res)=>{
    res.send("Welcome to home page")
})

app.get("/users",(req,res)=>{
    res.send("<h1>this is users page</h1> ")
})
// const students=[
//     {id:1,name:"Mahi", branch:"CS"},
//     {id:2,name:"Anushka", branch:"ECE"},
//     {id:3,name:"Agrima", branch:"Ec"},
//     {id:4,name:"Chhavi", branch:"Cyber"}


// ]

app.get("/students",(req,res) => {
    res.json(students); 
});

app.get("/users/:id",(req,res)=>{
    const userId=req.params.id
    res.send(`You are requesting for User Id:${userId}`)
})
app.get("/students/search",(req,res)=>{
    const branch=req.query.branch;
    console.log("branch",branch);
    if(!branch){
        return res.json(students);
    }
    const foundStudents=students.filter(s=>s.branch==branch);
    res.json(foundStudents);

})


    

app.get("/students/:id",(req,res)=>{
    const id =req.params.id;

    const arrayIndex=students.findIndex(s=>s.id==id);
    if(arrayIndex<0){
        return res.status(404).send("Student not found");
    }

    const data =students[arrayIndex];
    res.json(data);




})
app.post("/students/register",(req,res)=>{
    const { id, name, branch } = req.body;

    
    if (!id || !name || !branch) {
        if(!id){
            return res.status(400).send("Please provide id")
        }
        else if(!name){
            return res.status(400).send("Please provide name")
        }
        else{
            return res.status(400).send("please provide branch")
        }

    }

    const existStudent = students.find(s => s.id == id);

    if (existStudent) {
        return res.status(409).send(`Student with ID ${id} already exists`)
    }
    const newStudent = { id, name, branch };

    students.push(newStudent)
    fs.writeFileSync("./db.json", JSON.stringify(students))
    res.json(students);

})


app.listen(PORT,()=>{
    console.log(`Server is Running on port:${PORT}`)
})