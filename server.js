const express = require("express");
const app = express();

app.use(express.json());

// Sample Data

let books = [
  { id: 1, title: "Atomic Habits", author: "James Clear", year: 2018 },
  { id: 2, title: "Rich Dad Poor Dad", author: "Robert Kiyosaki", year: 1997 },
  { id: 3, title: "The Alchemist", author: "Paulo Coelho", year: 1988 },
  { id: 4, title: "Think and Grow Rich", author: "Napoleon Hill", year: 1937 }
];

let authors = [
  { id: 1, name: "James Clear", country: "USA" },
  { id: 2, name: "Paulo Coelho", country: "Brazil" }
];

// Exercise 2: Year Validation Middleware

function validateYear(req, res, next) {
  const { year } = req.body;

  if (year !== undefined) {
    if (typeof year !== "number") {
      return res.status(400).json({ message: "Year must be a number" });
    }

    if (year < 1800 || year > new Date().getFullYear()) {
      return res.status(400).json({ message: "Year must be between 1800 and current year" });
    }
  }

  next();
}

//Exercise 1 + 3: GET All Books
   // (Filtering + Pagination)

app.get("/books", (req, res) => {
  let { author, year, page = 1, limit = 10 } = req.query;

  let filteredBooks = [...books];

  // Filtering
  if (author) {
    filteredBooks = filteredBooks.filter(book =>
      book.author.toLowerCase() === author.toLowerCase()
    );
  }

  if (year) {
    filteredBooks = filteredBooks.filter(book =>
      book.year === parseInt(year)
    );
  }

  // Pagination
  page = parseInt(page);
  limit = parseInt(limit);

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

  res.json({
    total: filteredBooks.length,
    page,
    limit,
    data: paginatedBooks
  });
});

// Create Book

app.post("/books", validateYear, (req, res) => {
  const { title, author, year } = req.body;

  const newBook = {
    id: books.length + 1,
    title,
    author,
    year
  };

  books.push(newBook);
  res.status(201).json(newBook);
});

// Exercise 5: Search Books by Title


app.get("/books/search", (req, res) => {
  const { title } = req.query;

  if (!title) {
    return res.status(400).json({ message: "Title query parameter required" });
  }

  const results = books.filter(book =>
    book.title.toLowerCase().includes(title.toLowerCase())
  );

  res.json(results);
});


// Exercise 4: AUTHORS CRUD


// GET all authors
app.get("/authors", (req, res) => {
  res.json(authors);
});

// GET single author
app.get("/authors/:id", (req, res) => {
  const author = authors.find(a => a.id === parseInt(req.params.id));

  if (!author) return res.status(404).json({ message: "Author not found" });

  res.json(author);
});

// CREATE author
app.post("/authors", (req, res) => {
  const { name, country } = req.body;

  const newAuthor = {
    id: authors.length + 1,
    name,
    country
  };

  authors.push(newAuthor);
  res.status(201).json(newAuthor);
});

// UPDATE author
app.put("/authors/:id", (req, res) => {
  const author = authors.find(a => a.id === parseInt(req.params.id));

  if (!author) return res.status(404).json({ message: "Author not found" });

  author.name = req.body.name || author.name;
  author.country = req.body.country || author.country;

  res.json(author);
});

// DELETE author
app.delete("/authors/:id", (req, res) => {
  authors = authors.filter(a => a.id !== parseInt(req.params.id));
  res.json({ message: "Author deleted successfully" });
});

// Server

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
