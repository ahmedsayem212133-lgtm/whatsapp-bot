const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n--- নিচে দেওয়া QR Code টি স্ক্যান করুন ---\n');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('🎉 হোয়াটসঅ্যাপ বট সফলভাবে চালু হয়েছে!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify') {
            for (const msg of messages) {
                if (!msg.key.fromMe && msg.message) {
                    const from = msg.key.remoteJid;
                    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

                    if (text?.toLowerCase() === 'ping') {
                        await sock.sendMessage(from, { text: 'Pong! 🏓 বট কাজ করছে।' });
                    } else if (text?.toLowerCase() === 'hi' || text?.toLowerCase() === 'hello') {
                        await sock.sendMessage(from, { text: 'হ্যালো! আমি আপনার হোয়াটসঅ্যাপ বট।' });
                    }
                }
            }
        }
    });
}

connectToWhatsApp();
