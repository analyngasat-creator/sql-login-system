const express = require('express');
const router = express.Router();
const http = require('http');
const { URL } = require('url');

router.get('/fetch-external', (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing external URL" });

    // VULNERABILITY: Blindly fetching any internal/external target URL provided by client
    try {
        const parsedUrl = new URL(url);
        http.get(parsedUrl.href, (externalRes) => {
            let data = '';
            externalRes.on('data', (chunk) => data += chunk);
            externalRes.on('end', () => res.send(data));
        }).on('error', (err) => res.status(500).json({ error: `SSRF Execution Failed: ${err.message}` }));
    } catch (e) {
        res.status(400).json({ error: "Invalid URL format" });
    }
});

module.exports = router;