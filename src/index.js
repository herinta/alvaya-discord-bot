// ======================================================
// LOAD ENVIRONMENT VARIABLES
// ======================================================
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const http = require("http");
const { Client, GatewayIntentBits } = require("discord.js");


// ======================================================
// HTTP SERVER (WAJIB untuk Render Web Service)
// ======================================================
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot is running ✅");
}).listen(PORT, () => {
  console.log(`🌍 HTTP server running on port ${PORT}`);
});


// ======================================================
// CREATE DISCORD CLIENT
// ======================================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});


// ======================================================
// LOAD EVENTS AUTOMATICALLY
// ======================================================
const eventsPath = path.join(__dirname, "events");

if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith(".js"));

  for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));

    if (!event.name || !event.execute) {
      console.warn(`⚠️ Event ${file} tidak valid.`);
      continue;
    }

    if (event.once) {
      client.once(event.name, (...args) =>
        event.execute(...args, client)
      );
    } else {
      client.on(event.name, (...args) =>
        event.execute(...args, client)
      );
    }
  }

  console.log(`✅ Loaded ${eventFiles.length} event(s)`);
} else {
  console.warn("⚠️ Folder events tidak ditemukan.");
}


// ======================================================
// TEST COMMAND (SIMULASI WELCOME)
// ======================================================
client.on("messageCreate", message => {
  if (message.author.bot) return;

  if (message.content === "!testwelcome") {
    console.log("🔄 Simulating member join...");
    client.emit("guildMemberAdd", message.member);
    message.reply("Simulasi welcome dikirim!");
  }
});


// ======================================================
// CONNECTION & STATUS LOGGING
// ======================================================
client.once("clientReady", () => {
  console.log("=================================");
  console.log(`🤖 Logged in as: ${client.user.tag}`);
  console.log(`🆔 Bot ID: ${client.user.id}`);
  console.log(`⏰ Ready at: ${new Date().toLocaleString()}`);
  console.log("=================================");
});


client.on("disconnect", () => {
  console.log("⚠️ Bot disconnected!");
});

client.on("reconnecting", () => {
  console.log("🔄 Reconnecting to Discord...");
});

client.on("resume", () => {
  console.log("✅ Connection resumed");
});


// ======================================================
// LOGIN BOT
// ======================================================
console.log("🔍 Checking DISCORD_TOKEN...");

const token = process.env.DISCORD_TOKEN;

if (!token) {
  console.error("❌ DISCORD_TOKEN tidak ditemukan!");
  console.error("👉 Tambahkan di Render Environment Variables");
  process.exit(1);
}

console.log(`✅ Token detected: ${token.substring(0, 5)}...`);
console.log("🚀 Connecting to Discord...");

client.login(token).catch(err => {
  console.error("☠️ Failed to login:");
  console.error(err);
});


// ======================================================
// GLOBAL ERROR HANDLER (ANTI CRASH)
// ======================================================
process.on("unhandledRejection", err => {
  console.error("Unhandled Promise Rejection:", err);
});

process.on("uncaughtException", err => {
  console.error("Uncaught Exception:", err);
});
