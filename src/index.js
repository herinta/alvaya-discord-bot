/**
 * =========================================
 *  RENDER DISCORD BOT STABLE VERSION
 * =========================================
 */

// ⭐ FIX IPv6 handshake issue (WAJIB)
require('dns').setDefaultResultOrder('ipv4first');

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { Client, GatewayIntentBits } = require('discord.js');

console.log("------------------------------------------------");
console.log("🚀 Starting bot...");
console.log("Node version:", process.version);

// =========================================
// 1️⃣ HTTP SERVER (WAJIB untuk Web Service)
// =========================================
const PORT = process.env.PORT || 10000;

http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is alive ✅');
}).listen(PORT, () => {
  console.log(`🌍 HTTP server running on port ${PORT}`);
});

// =========================================
// 2️⃣ SELF PING (BIAR GA SLEEP)
// =========================================
if (process.env.RENDER_EXTERNAL_URL) {
  setInterval(() => {
    https.get(process.env.RENDER_EXTERNAL_URL);
    console.log("🔁 Self ping sent");
  }, 5 * 60 * 1000);
}

// =========================================
// 3️⃣ TEST KONEKSI KE DISCORD API
// =========================================
https.get("https://discord.com/api/gateway", res => {
  console.log("🌐 Discord API status:", res.statusCode);
}).on("error", err => {
  console.error("❌ Cannot reach Discord API:", err);
});

// =========================================
// 4️⃣ DISCORD CLIENT SETUP
// =========================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ],
  ws: {
    compress: false // ⭐ fix compression issue
  }
});

// =========================================
// 5️⃣ DEBUG & CONNECTION EVENTS
// =========================================
client.on("ready", () => {
  console.log(`🎉 BOT READY sebagai ${client.user.tag}`);
});

client.on("disconnect", () => {
  console.log("⚠️ Bot disconnected");
});

client.on("reconnecting", () => {
  console.log("🔄 Reconnecting...");
});

client.on("shardDisconnect", () => {
  console.log("⚠️ Shard disconnected");
});

client.on("shardReconnecting", () => {
  console.log("🔄 Shard reconnecting");
});

client.on("error", console.error);
client.on("shardError", console.error);

// =========================================
// 6️⃣ LOAD EVENTS (optional folder)
// =========================================
const eventsPath = path.join(__dirname, 'events');

if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }

  console.log(`✅ Loaded ${eventFiles.length} event(s)`);
} else {
  console.warn("⚠️ Folder 'events' tidak ditemukan");
}

// =========================================
// 7️⃣ TEST COMMAND
// =========================================
client.on('messageCreate', message => {
  if (message.content === '!ping') {
    message.reply('pong 🏓');
  }
});

// =========================================
// 8️⃣ LOGIN DISCORD (DELAY FIX RENDER)
// =========================================
console.log("🔍 Checking DISCORD_TOKEN...");

if (!process.env.DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN tidak ditemukan!");
  process.exit(1);
}

const maskedToken = process.env.DISCORD_TOKEN.slice(0, 5) + "...";
console.log("✅ Token detected:", maskedToken);
console.log("🚀 Connecting to Discord in 15 seconds...");

setTimeout(() => {
  client.login(process.env.DISCORD_TOKEN)
    .catch(err => {
      console.error("❌ LOGIN FAILED:", err);
    });
}, 15000);

console.log("------------------------------------------------");
