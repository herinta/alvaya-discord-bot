const { Events, EmbedBuilder } = require('discord.js');
const axios = require('axios');

// Variabel penyimpan ID agar tidak spam notifikasi berulang
let lastAnnouncedVideoId = null;

module.exports = {
    name: Events.ClientReady, // Sama fungsinya dengan 'ready', tapi lebih aman dari salah ketik
    once: true, // Karena cuma jalan sekali pas start
    async execute(client) {
        
        // 1. Pesan bawaan kamu sebelumnya
        console.log(`🚀 Siap meluncur! Login sebagai ${client.user.tag}`);
        console.log(`✅ Fitur YouTube Live Tracker aktif!`);

        // ==========================================
        // 2. KONFIGURASI YOUTUBE
        // ==========================================
        const YOUTUBE_CHANNEL_ID = 'UCI_7kBXAB3LURoI-vNiluHg'; 
        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY; 
        
        // ⚠️ TINGGAL GANTI INI PAKAI ID TEXT CHANNEL #LIVE KAMU
        const DISCORD_CHANNEL_ID = '1515011100746322001'; 

        // Waktu pengecekan setiap 5 menit (300000 milidetik)
        const checkInterval = 300000; 

        // ==========================================
        // 3. LOGIKA PENGECEKAN OTOMATIS
        // ==========================================
        setInterval(async () => {
            try {
                // Endpoint YouTube API untuk mencari Live Stream
                const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${YOUTUBE_CHANNEL_ID}&type=video&eventType=live&key=${YOUTUBE_API_KEY}`;
                
                const response = await axios.get(url);
                const items = response.data.items;

                // Jika ada video yang sedang live
                if (items.length > 0) {
                    const liveStream = items[0];
                    const videoId = liveStream.id.videoId;

                    // Cek apakah video ini sudah pernah diumumkan sebelumnya
                    if (videoId !== lastAnnouncedVideoId) {
                        lastAnnouncedVideoId = videoId; // Simpan ID baru

                        const targetChannel = client.channels.cache.get(DISCORD_CHANNEL_ID);
                        
                        if (targetChannel) {
                            const messageContent = [
                                '🐟 PSSST... FISHYYY!',
                                'Lele udah LIVE nihh~ 👀💙',
                                'Jangan ngumpet, sini kumpul! 🫧',
                                '',
                                '🔴 LIVE NOW!',
                                '@everyone'
                            ].join('\n');

                            const embed = new EmbedBuilder()
                                .setTitle(liveStream.snippet.title || '🔴 SEDANG LIVE DI YOUTUBE!')
                                .setURL(`https://www.youtube.com/watch?v=${videoId}`)
                                .setDescription(`Ayo tonton sekarang dan ramaikan kolom komentarnya!\n👉 **[KLIK DI SINI UNTUK MENONTON](https://www.youtube.com/watch?v=${videoId})**`)
                                .setColor('#FF0000')
                                .setImage(liveStream.snippet.thumbnails.high.url)
                                .setTimestamp();

                            await targetChannel.send({ 
                                content: messageContent, 
                                embeds: [embed],
                                allowedMentions: { parse: ['everyone'] }
                            });
                            console.log(`📢 Notifikasi Live terkirim untuk video ID: ${videoId}`);
                        }
                    }
                }
            } catch (error) {
                console.error("❌ Gagal mengecek status YouTube Live:", error.message);
            }
        }, checkInterval);
    },
};