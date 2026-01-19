const http = require("http");
const url = require("url");
const fs = require("fs");

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/complain")) {
    const parsedUrl = url.parse(req.url, true);
    const { name, issue, priority } = parsedUrl.query;

    // Generate Ticket ID
    const ticketId = "TKT-" + Math.floor(Math.random() * 100000);

    // Complaint data format
    const complaintData = `
Ticket ID: ${ticketId}
Name: ${name}
Issue: ${issue}
Priority: ${priority}
-------------------------
`;

    // Decide file based on priority
    const fileName =
      priority === "high" ? "URGENT.txt" : "normal_complaints.txt";

    // Write complaint to file
    fs.appendFile(fileName, complaintData, (err) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to save complaint" }));
        return;
      }

      // Send JSON response
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          ticketId: ticketId,
          message: "We will solve your issue soon."
        })
      );
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Route not found");
  }
});

// Start server
server.listen(8000, () => {
  console.log("Server running on http://localhost:8000");
});
