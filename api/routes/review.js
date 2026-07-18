const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    const db = req.app.get('db');
    db.all(`SELECT * FROM reviews`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.post('/', (req, res) => {
    const db = req.app.get('db');
    const { comment } = req.body;

    // VULNERABILITY: Raw input data enters database entirely unsanitized
    db.run(`INSERT INTO reviews (comment) VALUES (?)`, [comment], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, comment });
    });
});

module.exports = router;