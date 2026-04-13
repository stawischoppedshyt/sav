const express = require('express');
const app = express();
app.use(express.json());

let serverCache = [];

app.post('/update', (req, res) => {
    const { jobId, rarity, gen } = req.body;
    const newData = { jobId, rarity, gen, timestamp: new Date().toLocaleTimeString() };
    if (!serverCache.some(s => s.jobId === jobId)) {
        serverCache.unshift(newData);
    }
    if (serverCache.length > 15) serverCache.pop();
    res.status(200).send({ status: "ok" });
});

app.get('/list', (req, res) => {
    res.json(serverCache);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
