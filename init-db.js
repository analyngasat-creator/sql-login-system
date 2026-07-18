const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

const sql = fs.readFileSync(path.join(__dirname, 'setup.sql'), 'utf8');

db.exec(sql, (err) => {
    if (err) {
        console.error("Database initialization failed:", err.message);
    } else {
        console.log("Database initialized successfully.");
    }
    db.close();
});