const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());

// Cloud optimized Puppeteer settings
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }
});

client.on('qr', (qr) => {
    console.log('====================================');
    console.log('NEECHE DIYE GAYE QR KO SCAN KAREIN:');
    qrcode.generate(qr, { small: true });
    console.log('====================================');
});

client.on('ready', () => {
    console.log('✅ Client is ready! WhatsApp Cloud se connect ho gaya hai.');
});

app.post('/send-message', async (req, res) => {
    const { number, message } = req.body;
    if (!number || !message) return res.status(400).send({ status: 'Error', error: 'Missing data' });

    try {
        const formattedNumber = `${number}@c.us`;
        await client.sendMessage(formattedNumber, message);
        console.log(`Message sent to ${number}`);
        res.status(200).send({ status: 'Success' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ status: 'Error', error: error.toString() });
    }
});

client.initialize();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
