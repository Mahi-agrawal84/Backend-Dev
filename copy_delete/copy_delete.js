const fs=require("fs");
// fs.copyFileSync("../javascript/testing.txt","copied.txt");
 fs.copyFile("../javascript/testing.txt","copied.txt", (err)=>{
    if(err){
        console.log("error");
        return;
    }
    console.log("File copied");
 })
try{
    fs.readFileSync("copied.txt","utf-8")
    console.log("File is copied")
}
catch(err){
    console.log("Error while copying the file")
}

fs.unlink("copied.txt",(err)=>{
    if(err){
        console.log("error while deleting file");
        return;
    }
    console.log("file deleted");
})

fs.writeFile("newFile.txt","This is new file",(err)=>{
    if(err){
        console.log("error while writing file");
        return;
    }
    console.log("file created");
})


fs.mkdir("folders/folder1/folder2",{recursive:true},(err)=>{
    if(err){
        console.log("");
        return;
    }
    console.log("Directory is created");
})
fs.readdir("./file-handling",(err,files)=>{
    if(err){
        console.log("error while reading directory");
        return;
    }
    console.log(files);
})