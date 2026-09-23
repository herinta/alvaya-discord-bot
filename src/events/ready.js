const { Events } = require('discord.js');
const axios = require('axios');
const config = require('../config/config');

let lastAnnouncedVideoId = null;

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`🎉 BOT READY sebagai ${client.user.tag}`);
        console.log(`🚀 Siap meluncur! Server terhubung: ${client.guilds.cache.size}`);

        // 1. Proteksi Server Whitelist (Auto-leave server asing saat start)
        if (config.allowedGuilds.length > 0) {
            for (const guild of client.guilds.cache.values()) {
                if (!config.allowedGuilds.includes(guild.id)) {
                    console.log(`⛔ Keluar otomatis saat start dari server asing: ${guild.name} (${guild.id})`);
                    await guild.leave().catch(() => {});
                }
            }
        }

        // 2. Pendaftaran Slash Commands secara Otomatis dari client.commands
        try {
            const commandDataList = client.commands.map(cmd => cmd.data);
            
            // Hapus Global Commands agar tidak duplikat dengan Guild Commands
            await client.application.commands.set([]);

            // Daftarkan ke semua Guild yang terhubung
            for (const guild of client.guilds.cache.values()) {
                await guild.commands.set(commandDataList);
            }
            console.log(`✅ Berhasil mendaftarkan ${commandDataList.length} slash command(s) ke seluruh server!`);
        } catch (error) {
            console.error("❌ Gagal mendaftarkan slash commands:", error);
        }

        // 3. YouTube Live Tracker
        if (config.youtube.apiKey) {
            console.log(`✅ Fitur YouTube Live Tracker aktif!`);

            setInterval(async () => {
                try {
                    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${config.youtube.channelId}&type=video&eventType=live&key=${config.youtube.apiKey}`;
                    
                    const response = await axios.get(url);
                    const items = response.data.items;

                    if (items && items.length > 0) {
                        const liveStream = items[0];
                        const videoId = liveStream.id.videoId;

                        if (videoId !== lastAnnouncedVideoId) {
                            lastAnnouncedVideoId = videoId;

                            const targetChannel = client.channels.cache.get(config.channels.youtubeLive);
                            
                            if (targetChannel) {
                                const messageContent = [
                                    '🐟 PSSST... FISHYYY!',
                                    'Lele udah LIVE nihh~ 👀💙',
                                    'Jangan ngumpet, sini kumpul! 🫧',
                                    '',
                                    '🔴 LIVE NOW!',
                                    `https://www.youtube.com/watch?v=${videoId}`,
                                    '@everyone'
                                ].join('\n');

                                await targetChannel.send({ 
                                    content: messageContent, 
                                    allowedMentions: { parse: ['everyone'] }
                                });
                                console.log(`📢 Notifikasi Live terkirim untuk video ID: ${videoId}`);
                            }
                        }
                    }
                } catch (error) {
                    console.error("❌ Gagal mengecek status YouTube Live:", error.message);
                }
            }, config.youtube.checkIntervalMs);
        } else {
            console.log(`ℹ️ YouTube Live Tracker dilewati (YOUTUBE_API_KEY tidak ada di .env)`);
        }
    },
};