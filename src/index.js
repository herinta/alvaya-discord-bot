require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Client, GatewayIntentBits } = require('discord.js');

// --- 1. DUMMY SERVER (Biar Render Gak Marah/Timeout) ---
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot is running and healthy!');
});

server.listen(PORT, () => {
    console.log(`🌍 Server HTTP nyala di port ${PORT}`);
});


// --- 2. SETUP DISCORD BOT ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers, // Wajib buat welcome
        GatewayIntentBits.MessageContent
    ]
});

// --- 3. EVENT HANDLER (Auto-Load file dari folder 'events') ---
const eventsPath = path.join(__dirname, 'events');

// Cek dulu folder events ada apa ngga, biar ga crash kalo kosong
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }
} else {
    console.warn("⚠️ Folder 'events' tidak ditemukan! Fitur event handler dilewati.");
}

// --- 4. COMMAND MANUAL (Buat Test Welcome) ---
client.on('messageCreate', (message) => {
    if (message.content === '!testwelcome') {
        console.log('🔄 Simulasi member join...');
        client.emit('guildMemberAdd', message.member); 
        message.reply('Simulasi Welcome dikirim!');
    }
});


// --- 5. LOGIN & DEBUGGING (Bagian Penting!) ---
console.log("------------------------------------------------");
console.log("🕵️  DIAGNOSA LOGIN...");

// Cek ketersediaan Token
if (!process.env.DISCORD_TOKEN) {
    console.error("❌ ERROR FATAL: Token KOSONG / Tidak Terbaca!");
    console.error("👉 Solusi: Buka Dashboard Render -> Environment -> Add 'DISCORD_TOKEN'");
} else {
    // Tampilkan 5 huruf depan token buat mastiin (jangan pernah print full token!)
    const maskedToken = process.env.DISCORD_TOKEN.substring(0, 5) + "...";
    console.log(`✅ Token ditemukan: ${maskedToken}`);
    console.log("🚀 Mencoba menghubungkan ke Discord...");

    client.login(process.env.DISCORD_TOKEN)
        .then(() => {
            console.log(`🎉 BERHASIL LOGIN sebagai ${client.user.tag}!`);
            console.log("✅ Bot sekarang ONLINE.");
        })
        .catch((error) => {
            console.error("☠️ GAGAL LOGIN! Ini detail errornya:");
            console.error(error); 
            // Kalau errornya "DisallowedIntents", berarti settingan di Dev Portal belum dicentang.
            // Kalau errornya "TokenInvalid", berarti token salah.
        });
}
console.log("------------------------------------------------");