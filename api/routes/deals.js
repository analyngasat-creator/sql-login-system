const express = require('express');
const router = express.Router();

// Helper sleep function to cleanly demonstrate race condition gaps
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

router.post('/claim', async (req, res) => {
    const db = req.app.get('db');
    const { code } = req.body;

    db.get(`SELECT * FROM coupons WHERE code = ?`, [code], async (err, coupon) => {
        if (err || !coupon) return res.status(404).json({ error: "Coupon not found" });

        // VULNERABILITY: Check happens before update with a non-atomic async delay
        if (coupon.used_count >= coupon.max_uses) {
            return res.status(400).json({ error: "Coupon already fully redeemed!" });
        }

        // Simulating processing execution delay window
        await sleep(100);

        db.run(`UPDATE coupons SET used_count = used_count + 1 WHERE code = ?`, [code], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: updateErr.message });
            res.json({ success: true, message: `Discount applied! Current usage count: ${coupon.used_count + 1}` });
        });
    });
});

module.exports = router;