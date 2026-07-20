const express = require('express');
const router = express.Router();
router.get('/', (req, res) => {
    res.json({ category: "JavaScript Runtime Errors", detectableBugs: ["Undefined/Null property access", "Reference and Type errors", "Infinite recursion / stack overflow", "Malformed script / syntax error", "Code-split chunk failure", "Unhandled promise rejection", "Renderer crash", "Console errors"] });
});
module.exports = router;