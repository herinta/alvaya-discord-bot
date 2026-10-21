const { EmbedBuilder } = require('discord.js');
const levelModel = require('../database/models/levelModel');
const config = require('../config/config');

// Cache Cooldown di memory: key `${guildId}:${userId}` -> timestamp
const cooldowns = new Map();
const COOLDOWN_MS = 20 * 1000; // 1 detik (Mode testing demo spam chat)

/**
 * Sinkronisasi role reward berdasarkan level
 * Memberikan role level baru dan melepas role level sebelumnya agar rapi
 * @param {import('discord.js').GuildMember} member 
 * @param {number} targetLevel 
 */
async function syncLevelRole(member, targetLevel) {
    if (!member || !member.roles || !config.levelRoles) return null;
    const targetRoleId = config.levelRoles[targetLevel];
    if (!targetRoleId) return null;

    try {
        // Tambahkan role level baru
        await member.roles.add(targetRoleId).catch(() => {});

        // Hapus role level sebelumnya agar tidak menumpuk
        const allLevelRoleIds = Object.values(config.levelRoles);
        const rolesToRemove = allLevelRoleIds.filter(id => id !== targetRoleId && member.roles.cache.has(id));
        if (rolesToRemove.length > 0) {
            await member.roles.remove(rolesToRemove).catch(() => {});
        }

        return targetRoleId;
    } catch (error) {
        console.error('❌ Gagal sinkronisasi role level:', error.message);
        return null;
    }
}

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

        // Jika naik level, berikan role dan kirim ucapan selamat
        if (result.leveledUp) {
            const isMax = result.newLevel >= 10;
            await syncLevelRole(message.member, result.newLevel);

            const levelUpEmbed = new EmbedBuilder()
                .setColor('#58B9FF')
                .setTitle(isMax ? '👑🫧 PENGUASA AQUARIUM! — MAX LEVEL REACHED! 🐟' : '🌊🫧 SPLASH! LEVEL UP! 🐟')
                .setDescription(
                    `«𓆝 𓆟 𓆞 𓆝 𓆟\n` +
                    `Waaah selamat <@${userId}>! Kamu berhasil berenang makin jauh dan mencapai **Level ${result.newLevel}**${isMax ? ' 👑' : ''}! 🫧💙\n` +
                    `»`
                )
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `Aquarium Teles • Total XP: ${result.totalXp.toLocaleString()} 🫧` })
                .setTimestamp();

            await message.channel.send({
                content: `🫧 Splash! Yeay naik level nih~ <@${userId}> 𓆝 𓆟 💙`,
                embeds: [levelUpEmbed]
            }).catch(() => {});
        }
    } catch (error) {
        console.error('❌ Gagal memproses XP pengguna:', error.message);
    }
}

module.exports = {
    handleChatMessage,
    syncLevelRole
};
