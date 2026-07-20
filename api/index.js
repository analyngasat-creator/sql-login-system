// index.js - The complete server entry point
const express = require('express');
const path = require('path');
const app = express();

// --- THIS IS THE PART THAT WAS MISSING ---
// Import the central dispatcher you just created
const bugRoutes = require('./api/routes/index');

// Mount the dispatcher to your API path
app.use('/api/routes', bugRoutes);
// ------------------------------------------

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`BugSafari server is running at http://localhost:${PORT}`);
});