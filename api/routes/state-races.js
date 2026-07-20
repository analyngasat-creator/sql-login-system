const express = require('express');
const router = express.Router();
router.get('/', (req, res) => {
    res.json({ category: "Duplicate Actions / State Races", detectableBugs: ["Duplicate submission (double-submit)", "Guarded duplicate", "SPA state race / teardown race"] });
});
module.exports = router;