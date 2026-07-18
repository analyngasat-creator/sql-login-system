const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Global Database connection
const db = new sqlite3.Database(path.join(__dirname, '../database.sqlite'));
app.set('db', db);

// Register atomic vulnerability routes
app.use('/api/catalog', require('./routes/catalog'));
app.use('/api/deals', require('./routes/deals'));
app.use('/api/compare', require('./routes/compare'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/reviews', require('./routes/review')); // matches file: review.js

// Local server initialization (Only runs when executing file directly)
if (require.main === module) {
    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`[+] Stitch Lab Backend actively listening on http://localhost:${PORT}`);
    });
}

module.exports = app;