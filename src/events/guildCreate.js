const { Events } = require('discord.js');
const config = require('../config/config');

module.exports = {
    name: Events.GuildCreate,
    async execute(guild) {
        console.log(`📥 Bot diundang ke server baru: ${guild.name} (ID: ${guild.id})`);

        // Jika ada daftar whitelist server dan server ini TIDAK ada di whitelist
        if (config.allowedGuilds.length > 0 && !config.allowedGuilds.includes(guild.id)) {
            console.log(`⛔ Server ${guild.name} (${guild.id}) tidak ada dalam whitelist. Keluar otomatis...`);
            
            try {
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
