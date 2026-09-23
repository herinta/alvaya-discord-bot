/**
 * =========================================
 *  ALVAYA DISCORD BOT - ENTRY POINT
 * =========================================
 */

require('dns').setDefaultResultOrder('ipv4first');
require('dotenv').config();

const http = require('http');
const https = require('https');
const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config/config');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const { initDatabase } = require('./database/db');

console.log('------------------------------------------------');
console.log('🚀 Starting Alvaya Bot...');

// HTTP Keepalive Server (untuk hosting seperti Render / Pterodactyl)
const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Alvaya Bot is alive ✅');
}).listen(PORT, () => console.log(`🌍 HTTP server running on port ${PORT}`));

if (process.env.RENDER_EXTERNAL_URL) {
    setInterval(() => {
        https.get(process.env.RENDER_EXTERNAL_URL);
    }, 5 * 60 * 1000);
}

// Inisialisasi Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ],
    ws: { compress: false }
});

// Load Commands & Events
loadCommands(client);
loadEvents(client);

// Inisialisasi Database (hanya jika fitur leveling aktif)
if (config.features?.leveling) {
    initDatabase().catch(err => {
        console.warn('⚠️ Gagal inisialisasi koneksi database:', err.message);
    });
}

// Login Bot
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN tidak ditemukan di file .env!');
    process.exit(1);
}

client.login(process.env.DISCORD_TOKEN).catch(console.error);