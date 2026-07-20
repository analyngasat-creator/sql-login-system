const express = require('express');
const router = express.Router();
router.get('/', (req, res) => {
    res.json({ category: "Accessibility (WCAG 2.1)", detectableBugs: ["image-alt", "form-label", "control-name", "tabindex-positive", "duplicate-id", "html-lang", "document-title"] });
});
module.exports = router;