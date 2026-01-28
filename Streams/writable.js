const { log } = require("console");
const fs = require("fs");

const path = require("path");

const inputFilePath = path.join(__dirname,"input.txt");

const outputFilePath = path.join(__dirname,"output.txt");

const readStream = fs.createReadStream(inputFilePath);

const writeStream = fs.createWriteStream(outputFilePath);

readStream.pipe(writeStream);

writeStream.on("finish",()=>{
    console.log("Writing Stream is end");
})