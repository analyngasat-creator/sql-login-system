const express = require('express');
const router = express.Router();
router.get('/', (req, res) => {
    res.json({ category: "Input Validation & Security", detectableBugs: ["Client-side constraint bypass", "Reflected XSS", "NoSQL injection", "Server instability from fuzzing", "Security information leak", "Client-trusted auth state (broken access control)"] });
});
module.exports = router;