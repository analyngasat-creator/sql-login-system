const express = require('express');
const router = express.Router();

router.get('/:id', (req, res) => {
    const db = req.app.get('db');
    const wishlistId = req.params.id;

    // VULNERABILITY: Validates path exists but lacks authorization ownership mapping check
    db.get(`SELECT * FROM wishlists WHERE id = ?`, [wishlistId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Wishlist records not found" });
        res.json(row);
    });
});

module.exports = router;