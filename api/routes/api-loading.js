const express = require('express');
const router = express.Router();
router.get('/', (req, res) => {
    res.json({ category: "Unhandled API Failure / Infinite Loading", detectableBugs: ["Infinite loading / API hang"] });
});
module.exports = router;