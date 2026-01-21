const http = require("http");
const url = require("url");
const fs = require("fs");

const PORT = 8000;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === "/product") {
    const { name, price, discount } = parsedUrl.query;

    // Validation
    if (!name || !price || !discount) {
      res.writeHead(400, { "Content-Type": "text/html" });
      res.end("<h2>❌ Missing query parameters</h2>");
      return;
    }

    const originalPrice = Number(price);
    const discountPercent = Number(discount);

    const discountAmount = (originalPrice * discountPercent) / 100;
    const finalPrice = originalPrice - discountAmount;

    // Log search into file
    const logData = `Product: ${name}, Price: ${price}, Discount: ${discount}% | Final Price: ${finalPrice} | Time: ${new Date().toLocaleString()}\n`;

    fs.appendFile("searches.txt", logData, (err) => {
      if (err) console.error("Error writing to file");
    });

    // HTML Response
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
      <html>
        <head>
          <title>Product Details</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f6f8;
              padding: 40px;
            }
            .card {
              max-width: 500px;
              margin: auto;
              background: white;
              padding: 25px;
              border-radius: 10px;
              box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            }
            h2 {
              color: #2c3e50;
              text-align: center;
            }
            p {
              font-size: 16px;
              line-height: 1.6;
            }
            .price {
              font-weight: bold;
              color: #27ae60;
              font-size: 18px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>🛒 Product Search Result</h2>
            <p><strong>Product Name:</strong> ${name}</p>
            <p><strong>Original Price:</strong> ₹${originalPrice}</p>
            <p><strong>Discount:</strong> ${discountPercent}%</p>
            <p class="price">Final Price: ₹${finalPrice}</p>
          </div>
        </body>
      </html>
    `);
  } else {
    res.writeHead(404, { "Content-Type": "text/html" });
    res.end("<h2>❌ Page Not Found</h2>");
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
