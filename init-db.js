const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const db = new sqlite3.Database('./database.sqlite');

const schema = fs.readFileSync('./setup.sql', 'utf8');

db.exec(schema, (err) => {
    if (err) console.error("Database init error:", err);
    else console.log("Database initialized for BugSafari!");
});