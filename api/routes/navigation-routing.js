const express = require('express');
const router = express.Router();
router.get('/', (req, res) => {
    res.json({ category: "Navigation & Routing Defects", detectableBugs: ["Dead interaction", "Broken route", "Redirect loop (HTTP)", "Redirect loop (SPA)", "Back-navigation state loss", "Malformed route mutation"] });
});
module.exports = router;