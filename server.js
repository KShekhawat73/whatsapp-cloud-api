const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

// 1. Pehle Express server ko bind karein taaki Render ko port turant mil jaye
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on port ${PORT}`);
});

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

let isReady = false;

client.on('qr', (qr) => {
    isReady = false;
    console.log('====================================');
    console.log('Naya PERFECT QR code dekhne ke liye niche diye gaye link par click karein:');
    console.log(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}`);
    console.log('====================================');
});

client.on('ready', () => {
    isReady = true;
    console.log('✅ Client is ready! WhatsApp Cloud se connect ho gaya hai.');
});

client.on('auth_failure', (msg) => {
    isReady = false;
    console.error('Authentication failure:', msg);
});

client.on('disconnected', (reason) => {
    isReady = false;
    console.log('Client was disconnected:', reason);
});

// 2. 3 seconds ke delay ke baad WhatsApp initialize karein (Port timeout bachane ke liye)
setTimeout(() => {
    console.log('Initializing WhatsApp client...');
    client.initialize().catch(err => {
        console.error('Initialization error:', err);
    });
}, 3000);

app.post('/send-message', async (req, res) => {
    if (!isReady) {
        return res.status(500).json({ status: 'Error', error: 'WhatsApp client not ready yet' });
    }
    
    const { number, message } = req.body;
    if (!number || !message) {
        return res.status(400).json({ status: 'Error', error: 'Missing data' });
    }

    try {
        const formattedNumber = `${number}@c.us`;
        await client.sendMessage(formattedNumber, message);
        console.log(`Message sent to ${number}`);
        res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error('Send error:', error);
        res.status(500).json({ status: 'Error', error: error.toString() });
    }
});
