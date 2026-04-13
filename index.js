const express = require('express');
const app = express();
app.use(express.json());

let serverCache = [];

// API to receive data from the Scanner
app.post('/update', (req, res) => {
    const { jobId, rarity, gen } = req.body;
    const newData = { 
        jobId, 
        rarity, 
        gen, 
        timestamp: new Date().toLocaleTimeString(),
        addedAt: Date.now() // Used for internal tracking
    };
    
    // Check for duplicates so we don't spam the same server
    if (!serverCache.some(s => s.jobId === jobId)) {
        serverCache.unshift(newData);
    }
    
    // Keep the list size manageable (max 20)
    if (serverCache.length > 20) serverCache.pop();
    
    res.status(200).send({ status: "ok" });
});

// API for the GUI to fetch the list
app.get('/list', (req, res) => {
    res.json(serverCache);
});

// --- NEW: AUTO-CLEAR LOGIC ---
// This runs every 60 seconds (60000 milliseconds)
setInterval(() => {
    const beforeCount = serverCache.length;
    serverCache = []; // Wipes the entire cache
    if (beforeCount > 0) {
        console.log(`[Auto-Clear] Wiped ${beforeCount} logs from the server.`);
    }
}, 60000); 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
