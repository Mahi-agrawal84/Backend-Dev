const http = require("http");
const fs = require("fs");
const url = require("url");

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    const log = `${new Date().toISOString()} | ${req.method} | ${req.url}\n`;

    fs.appendFile("server.log", log, (err) => {
        if (err) {
            console.error("Error writing log:", err);
        }
    });

    switch (pathname) {
        case "/":
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("Welcome to the Home Page");
            break;

        case "/about":
            const user = {
                name: "govind",
                age: 30,
                occupation: "Developer"
            };
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(user));
            break;
        case "/greet":
            const name = query.name || "Guest";
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end(`Hello, ${name}! Welcome to our server.`);
            break;

        default:
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Page Not Found");
    }
});

server.listen(8080, () => {
    console.log("Server is running on port 8080");
});

//------------------------------------------------------------------------------------------------------------------

// const http= require('http');
// const PORT = 5000;
// const userLogs = [];

// const server = http.createServer((req,res)=>{
//     const logEntry = {
//         timestamp: new Date().toISOString(),
//         method: req.method,
//         url: req.url,
//         ip: req.socket.remoteAddress
//     };
//     userLogs.push(logEntry);
//     console.log(`[${logEntry.timestamp}] ${logEntry.method} ${logEntry.url}\n\n`);
    
//     const method = req.method;

//     switch(req.url){
//         case '/':
//             res.writeHead(200, {'Content-Type': 'application/json'});
//             res.end('Welcome to the Home Page');
//             break;
//         case '/about':
//             res.writeHead(200, {'Content-Type': 'application/json'});
//             res.end('About Us Page');
//             break;
//         case '/userlog':
//             res.writeHead(200, {'Content-Type': 'application/json'});
//             res.end(JSON.stringify({ logs: userLogs, total: userLogs.length }));
//             break;
//         default:
//             res.writeHead(404, {'Content-Type': 'application/json'});
//             res.end('404 Not Found');

//     }
    
// })
// server.listen(PORT, ()=>{ 
//     console.log(`Server is listening on port ${PORT} at http://localhost:${PORT}`);
// })

//---------------------------------------------------------------------------------------------------------------------------------------


// const http = require("http");
// const fs = require("fs");

// const server = http.createServer((req, res) => {
//   //   res.writeHead(200, { "Content-Type": "text/html" });
//   //   res.end("Server is running");

//   let logTime = new Date().toLocaleString();
//   const method = req.method;
//   const url = req.url;

//   let msg = `${logTime} - ${method} requested for ${url}\n`;
//   fs.appendFile("text.log", msg, (err) => {
//     if (err) console.log("Error writting log");
//   });

//   switch (req.url) {
//     case "/":
//       res.end("Welcome to Home Page");
//       break;
//     case "/about":
//       res.end("Welcome to about Us");
//       break;
//     default:
//       res.writeHead(404, { "content-type": "text/html" });
//       res.end("Error! Page Not Found");
//   }
// });

// server.listen(8000, () => {
//   console.log("Server is running on port 8000");
// });





