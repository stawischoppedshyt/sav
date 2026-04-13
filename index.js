const express = require('express');
const app = express();
app.use(express.json());

let serverCache = [];

app.post('/update', (req, res) => {
    const { jobId, rarity, gen } = req.body;
    
    // Prevent duplicates
    if (!serverCache.some(s => s.jobId === jobId)) {
        serverCache.unshift({ 
            jobId, 
            rarity, 
            gen, 
            timestamp: new Date().toLocaleTimeString(),
            expiry: Date.now() + 60000 // Set expiry to 60 seconds from now
        });
    }
    res.status(200).send({ status: "ok" });
});

app.get('/list', (req, res) => {
    // Only send logs that haven't expired yet
    const now = Date.now();
    serverCache = serverCache.filter(log => log.expiry > now);
    res.json(serverCache);
});

// Periodic cleanup just to keep memory low
setInterval(() => {
    const now = Date.now();
    serverCache = serverCache.filter(log => log.expiry > now);
}, 10000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
