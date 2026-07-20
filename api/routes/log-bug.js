const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

router.post('/', (req, res) => {
    const { category, message, url } = req.body;
    db.run("INSERT INTO bug_logs (category, error_message, page_url) VALUES (?, ?, ?)", 
    [category, message, url], (err) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json({ success: true });
    });
});
module.exports = router;