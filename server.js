const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

let latestQR = '';
let isReady = false;

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

client.on('qr', (qr) => {
    latestQR = qr;
    isReady = false;
    console.log('QR Code generated!');
});

client.on('ready', () => {
    isReady = true;
    latestQR = '';
    console.log('✅ Client is ready!');
});

client.on('auth_failure', (msg) => {
    isReady = false;
});

client.on('disconnected', (reason) => {
    isReady = false;
});

setTimeout(() => {
    client.initialize().catch(err => {
        console.error('Init error:', err);
    });
}, 3000);

// Naya Web Page route jahan seedha QR code dikhega
app.get('/qr', (req, res) => {
    if (isReady) {
        res.send('<h2>✅ WhatsApp is already connected and ready!</h2>');
    } else if (latestQR) {
        res.send(`
            <h2>Apne WhatsApp se yeh QR code scan karein:</h2>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(latestQR)}" alt="QR Code"/>
            <p>Page ko har 5 second mein refresh karein agar scan na ho.</p>
        `);
    } else {
        res.send('<h2>QR code generate ho raha hai, 10 second baad page refresh karein...</h2>');
    }
});

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
        res.status(200).json({ status: 'success' });
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.toString() });
    }
});
