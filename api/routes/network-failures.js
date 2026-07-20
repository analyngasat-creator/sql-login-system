const express = require('express');
const router = express.Router();
router.get('/', (req, res) => {
    res.json({ category: "Network & Backend Failures", detectableBugs: ["Server error (5xx)", "Soft-fail body masked as success", "Transport-level failure", "Cascading network failure"] });
});
module.exports = router;