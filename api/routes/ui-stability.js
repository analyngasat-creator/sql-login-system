const express = require('express');
const router = express.Router();
router.get('/', (req, res) => {
    res.json({ category: "UI Stability", detectableBugs: ["Main-thread lock-up (UI freeze)"] });
});
module.exports = router;