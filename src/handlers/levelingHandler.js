const { EmbedBuilder } = require('discord.js');
const levelModel = require('../database/models/levelModel');

// Cache Cooldown di memory: key `${guildId}:${userId}` -> timestamp
const cooldowns = new Map();
const COOLDOWN_MS = 60 * 1000; // 60 detik (1 menit)

/**
 * Memproses XP dari chat pengguna
 * @param {import('discord.js').Message} message 
 */
async function handleChatMessage(message) {
    if (!message.guild || message.author.bot) return;

    // Abaikan pesan jika berupa prefix command (seperti !, /, ?, .)
    const content = message.content.trim();
    if (content.startsWith('!') || content.startsWith('/') || content.startsWith('.') || content.length < 3) {
        return;
    }

    const guildId = message.guild.id;
    const userId = message.author.id;
    const cacheKey = `${guildId}:${userId}`;
    const now = Date.now();

    // Cek Cooldown Anti-Spam
    const lastXpTime = cooldowns.get(cacheKey) || 0;
    if (now - lastXpTime < COOLDOWN_MS) {
        return; // Masih dalam masa cooldown 1 menit
    }

    // Set waktu cooldown baru
    cooldowns.set(cacheKey, now);

    // XP acak antara 15 sampai 25
    const xpToAdd = Math.floor(Math.random() * 11) + 15;

    try {
        const result = await levelModel.addXp(guildId, userId, xpToAdd);

        // Jika naik level, kirim pesan ucapan selamat
        if (result.leveledUp) {
            const levelUpEmbed = new EmbedBuilder()
                .setColor('#00FFFF')
                .setTitle('🎉 Level Up! 🫧')
                .setDescription(`Selamat <@${userId}>! Kamu berhasil mencapai **Level ${result.newLevel}**! 🌊🐟`)
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `Alvaya Leveling • Total XP: ${result.totalXp.toLocaleString()}` })
                .setTimestamp();

            await message.channel.send({
                content: `🎊 Gg <@${userId}>!`,
                embeds: [levelUpEmbed]
            }).catch(() => {});
        }
    } catch (error) {
        console.error('❌ Gagal memproses XP pengguna:', error.message);
    }
}

module.exports = {
    handleChatMessage
};
