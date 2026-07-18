const express = require('express');
const router = express.Router();

// Helper sleep function to demonstrate the Race Condition gap
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * @route   POST /api/deals/claim
 * @desc    Claims a discount coupon with combined vulnerabilities
 */
router.post('/claim', async (req, res) => {
    const db = req.app.get('db');
    const { code } = req.body;

    // We do NOT perform any validation checks against max_uses or user identity.
    // This allows the coupon to be claimed an unlimited number of times (Logic Flaw).
    
    // We add an artificial delay to open the vulnerability window.
    // During this time, the server is "waiting," and concurrent requests 
    // will see the same database state (Race Condition).
    await sleep(200);

    db.run(`UPDATE coupons SET used_count = used_count + 1 WHERE code = ?`, [code], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        res.json({ 
            success: true, 
            message: `Coupon ${code} claimed! You have exploited the unlimited claim and race condition.` 
        });
    });
});

/**
 * @route   POST /api/deals/admin-reset
 * @desc    Resets usage counts to 0 for continuous lab testing
 */
router.post('/admin-reset', (req, res) => {
    const db = req.app.get('db');
    db.run(`UPDATE coupons SET used_count = 0`, (err) => {
        if (err) return res.status(500).json({ error: "Reset failed" });
        res.json({ message: "Database usage counts have been reset to 0!" });
    });
});

module.exports = router;