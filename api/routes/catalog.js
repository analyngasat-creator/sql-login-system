const express = require('express');
const router = express.Router();

router.get('/search', (req, res) => {
    const db = req.app.get('db');
    const searchTerm = req.query.q || '';

    // VULNERABILITY: Raw string interpolation allows SQL injection payloads
    const query = `SELECT * FROM products WHERE name LIKE '%${searchTerm}%'`;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

module.exports = router;