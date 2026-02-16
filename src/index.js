const http = require('http');

const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot is running!');
});

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
// -

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers, // Wajib buat welcome
        GatewayIntentBits.MessageContent
    ]
});

// --- EVENT HANDLER (Auto-Load) ---
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    
    // Cek apakah event ini 'once' (sekali jalan) atau 'on' (terus menerus)
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.on('messageCreate', (message) => {
    // Kalau ketik !testwelcome, bot bakal anggep KAMU adalah member baru
    if (message.content === '!testwelcome') {
        console.log('🔄 Simulasi member join...');
        client.emit('guildMemberAdd', message.member); 
    }
});

client.login(process.env.DISCORD_TOKEN);