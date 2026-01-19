const http = require("http");
const url = require("url");
const fs = require("fs");

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/admin")) {
    const parsedUrl = url.parse(req.url, true);
    const { user, pass } = parsedUrl.query;

    // Check credentials
    if (user === "admin" && pass === "1234") {
      // Read admin dashboard file
      fs.readFile("admin_dashboard.html", "utf8", (err, data) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Error loading dashboard");
          return;
        }

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
      });
    } else {
      // Unauthorized access
      res.writeHead(401, { "Content-Type": "text/plain" });
      res.end("Access Denied");
    }
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Page Not Found");
  }
});

server.listen(8000, () => {
  console.log("Server running on http://localhost:8000");
});
