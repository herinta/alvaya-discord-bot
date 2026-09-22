/**
 * =========================================
 *  RENDER DISCORD BOT STABLE VERSION
 * =========================================
 */

require('dns').setDefaultResultOrder('ipv4first');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const { 
  Client, 
  GatewayIntentBits, 
  SlashCommandBuilder, 
  PermissionFlagsBits 
} = require('discord.js');

console.log("------------------------------------------------");
console.log("🚀 Starting bot...");

const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is alive ✅');
}).listen(PORT, () => console.log(`🌍 HTTP server running on port ${PORT}`));

if (process.env.RENDER_EXTERNAL_URL) {
  setInterval(() => {
    https.get(process.env.RENDER_EXTERNAL_URL);
  }, 5 * 60 * 1000);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates // 🔴 WAJIB UNTUK VOICE FITUR
  ],
  ws: { compress: false }
});

// Pendaftaran /announce
client.on("ready", async () => {
  console.log(`🎉 BOT READY sebagai ${client.user.tag}`);

  const announceCmd = new SlashCommandBuilder()
      .setName('announce')
      .setDescription('Buat pengumuman (Multi-baris / Embed / Teks biasa)')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addStringOption(option =>
          option.setName('tipe')
              .setDescription('Pilih tampilan pengumuman (Embed / Teks Biasa)')
              .setRequired(true)
              .addChoices(
                  { name: '📦 Embed (Kotak dengan Warna & Judul)', value: 'embed' },
                  { name: '📝 Teks Biasa (Pesan Standar)', value: 'biasa' }
              )
      );

  const editCmd = new SlashCommandBuilder()
      .setName('edit-message')
      .setDescription('Edit pesan atau pengumuman yang pernah dikirim oleh bot')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addStringOption(option =>
          option.setName('message_id')
              .setDescription('ID pesan bot yang ingin diedit (Klik kanan pesan -> Copy Message ID)')
              .setRequired(true)
      );

  const setupRolesCmd = new SlashCommandBuilder()
      .setName('setup-roles')
      .setDescription('Kirim panel Select Roles ke channel #select-roles')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addChannelOption(option =>
          option.setName('channel')
              .setDescription('Channel tujuan (Opsional, default: channel #select-roles)')
              .setRequired(false)
      );

  try {
      // 1. Hapus Global Commands agar tidak duplikat dengan Guild Commands di Discord
      await client.application.commands.set([]);

      // 2. Daftarkan hanya ke level Server/Guild (Langsung aktif & tidak dobel)
      for (const guild of client.guilds.cache.values()) {
          await guild.commands.set([announceCmd, editCmd, setupRolesCmd]);
      }
      console.log("✅ Command /announce, /edit-message, & /setup-roles berhasil diperbarui!");
  } catch (error) {
      console.error("❌ Gagal mendaftarkan slash commands:", error);
  }
});

// Event Handler Dinamis
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
}

if (!process.env.DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN tidak ditemukan!");
  process.exit(1);
}

setTimeout(() => {
  client.login(process.env.DISCORD_TOKEN).catch(console.error);
}, 15000);