const fs = require("fs");

const path = require("path");

const {Transform} = require("stream");

const inputFilePath = path.join(__dirname,"input.txt");

const transformOutputFilePath = path.join(__dirname,"transformOutput.txt");

const readStream = fs.createReadStream(inputFilePath);

const writeStream = fs.createWriteStream(transformOutputFilePath);

const upperCaseTransform = new Transform({
    transform(chunk,encoding,callback){
        const transformedData = chunk.toString().toUpperCase()

        this.push(transformedData);

        callback();
    }
})

readStream.pipe(upperCaseTransform).pipe(writeStream)
