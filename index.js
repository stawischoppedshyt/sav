const express = require('express');
const app = express();
app.use(express.json());

let serverCache = [];
const MAX_CACHE_SIZE = 100; // Prevents memory overflow on Free Tier

// --- THE FIX: REQUEST QUEUE ---
let requestQueue = [];
let isProcessing = false;

async function processQueue() {
    if (isProcessing || requestQueue.length === 0) return;
    isProcessing = true;

    while (requestQueue.length > 0) {
        const log = requestQueue.shift();
        
        // Check for duplicates before adding to live cache
        const exists = serverCache.find(s => s.jobId === log.jobId);
        if (!exists) {
            serverCache.unshift({
                ...log,
                expiry: Date.now() + 60000 // 1 minute life
            });
        }

        // Keep cache lean for Render Free Tier RAM limits
        if (serverCache.length > MAX_CACHE_SIZE) {
            serverCache.pop();
        }
    }

    isProcessing = false;
}

// Receive logs from scanner
app.post('/update', (req, res) => {
    // Push into queue instead of processing immediately
    requestQueue.push(req.body);
    processQueue(); 
    
    res.status(200).json({ status: "queued" });
});

// Fetch logs for GUI
app.get('/list', (req, res) => {
    const now = Date.now();
    // Filter out expired logs
    serverCache = serverCache.filter(log => log.expiry > now);
    res.json(serverCache);
});

// Keep-Awake Route
app.get('/ping', (req, res) => res.send("Alive"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Render Server Online on Port ${PORT}`);
});
