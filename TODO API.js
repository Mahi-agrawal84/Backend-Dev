const express = require('express');
const app = express();

app.use(express.json()); // Middleware to parse JSON

// In-memory task storage
let todos = [];
let idCounter = 1;

// Add a new task
app.post('/todos', (req, res) => {
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ message: 'Title is required' });
    }

    const newTodo = {
        id: idCounter++,
        title,
        completed: false
    };

    todos.push(newTodo);
    res.status(201).json(newTodo);
});

// Get all tasks
app.get('/todos', (req, res) => {
    res.json(todos);
});

// Get task by ID
app.get('/todos/:id', (req, res) => {
    const todo = todos.find(t => t.id === parseInt(req.params.id));

    if (!todo) {
        return res.status(404).json({ message: 'Task not found' });
    }

    res.json(todo);
});

// Update a task
app.put('/todos/:id', (req, res) => {
    const todo = todos.find(t => t.id === parseInt(req.params.id));

    if (!todo) {
        return res.status(404).json({ message: 'Task not found' });
    }

    const { title, completed } = req.body;

    if (title !== undefined) todo.title = title;
    if (completed !== undefined) todo.completed = completed;

    res.json(todo);
});

// Delete a task
app.delete('/todos/:id', (req, res) => {
    const index = todos.findIndex(t => t.id === parseInt(req.params.id));

    if (index === -1) {
        return res.status(404).json({ message: 'Task not found' });
    }

    const deletedTodo = todos.splice(index, 1);
    res.json(deletedTodo[0]);
});

// Start server
app.listen(3000, () => {
    console.log('TODO API running on http://localhost:3000');
});
