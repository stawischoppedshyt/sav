const express = require('express');
const app = express();
app.use(express.json());

let serverCache = [];
const MAX_CACHE_SIZE = 50;

// Queue system to prevent Plan Overload
let requestQueue = [];
let isProcessing = false;

async function processQueue() {
    if (isProcessing || requestQueue.length === 0) return;
    isProcessing = true;

    while (requestQueue.length > 0) {
        const data = requestQueue.shift();
        
        // Remove existing data for this server to prevent duplicates
        serverCache = serverCache.filter(item => item.jobId !== data.jobId);

        // Add the new server batch
        serverCache.unshift({
            jobId: data.jobId,
            plots: data.plots,
            gen: data.maxGen,
            expiry: Date.now() + 65000 // 65 second lifespan
        });

        if (serverCache.length > MAX_CACHE_SIZE) serverCache.pop();
    }
    isProcessing = false;
}

app.post('/update', (req, res) => {
    if (!req.body.jobId) return res.status(400).send("No JobID");
    requestQueue.push(req.body);
    processQueue();
    res.status(200).json({ status: "success" });
});

app.get('/list', (req, res) => {
    const now = Date.now();
    serverCache = serverCache.filter(log => log.expiry > now);
    res.json(serverCache);
});

app.get('/ping', (req, res) => res.send("Alive"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API Online on Port ${PORT}`));
