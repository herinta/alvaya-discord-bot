const { Events } = require('discord.js');

// ID Server yang diizinkan (Bisa diatur di .env atau langsung di sini)
// Jika punya lebih dari 1 server, pisahkan dengan koma di .env: ALLOWED_GUILD_IDS=id1,id2
const ALLOWED_GUILD_IDS = (process.env.ALLOWED_GUILD_IDS || process.env.ALLOWED_GUILD_ID || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);

module.exports = {
    name: Events.GuildCreate,
    async execute(guild) {
        console.log(`📥 Bot diundang ke server baru: ${guild.name} (ID: ${guild.id})`);

        // Jika ada daftar whitelist server dan server ini TIDAK ada di whitelist
        if (ALLOWED_GUILD_IDS.length > 0 && !ALLOWED_GUILD_IDS.includes(guild.id)) {
            console.log(`⛔ Server ${guild.name} (${guild.id}) tidak ada dalam whitelist. Keluar otomatis...`);
            
            try {
                // Coba kirim pesan pamit ke channel pertama yang bisa diakses (opsional)
                const defaultChannel = guild.systemChannel || 
                    guild.channels.cache.find(c => c.isTextBased() && c.permissionsFor(guild.members.me).has('SendMessages'));
                
                if (defaultChannel) {
                    await defaultChannel.send('⚠️ **Bot ini bersifat Private dan hanya diperuntukkan untuk server resmi.** Bot akan meninggalkan server ini sekarang.');
                }
            } catch (err) {
                // Abaikan jika tidak punya izin kirim pesan
            }

            // Otomatis keluar dari server asing
            await guild.leave();
            console.log(`👋 Berhasil keluar dari server asing: ${guild.name}`);
            return;
        }

        console.log(`✅ Server ${guild.name} diizinkan.`);
    }
};
