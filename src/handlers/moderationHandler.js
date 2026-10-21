// Daftar kata-kata terlarang (case-insensitive)
const BANNED_WORDS = [
    'kontol',
    'tolol',
    'titit',
    'memek',
    'kntl'
];

// Regex untuk mendeteksi kata terlarang (mencakup variasi huruf & simbol umum)
const BANNED_REGEX = new RegExp(`\\b(${BANNED_WORDS.join('|')})\\b`, 'i');

// Cache cooldown teguran agar bot tidak spam membalas (key: userId -> timestamp)
const warnCooldowns = new Map();
const WARN_COOLDOWN_MS = 8000; // 8 detik per user

/**
 * Mengecek apakah teks mengandung kata terlarang
 * @param {string} text 
 * @returns {boolean}
 */
function hasBannedWord(text) {
    if (!text) return false;
    // Bersihkan karakter pemisah aneh jika ada, lalu cek regex
    const normalized = text.toLowerCase().replace(/[\s._-]+/g, ' ');
    return BANNED_REGEX.test(normalized) || BANNED_WORDS.some(word => normalized.includes(word));
}

/**
 * Memeriksa dan merespons otomatis jika ada member yang menggunakan kata kasar
 * @param {import('discord.js').Message} message 
 * @returns {Promise<boolean>} return true jika pesan mengandung kata kasar
 */
async function handleBadWords(message) {
    if (!message.guild || message.author.bot) return false;

    if (!hasBannedWord(message.content)) {
        return false;
    }

    const userId = message.author.id;
    const now = Date.now();
    const lastWarn = warnCooldowns.get(userId) || 0;

    // Jika belum dalam masa cooldown teguran, kirim teguran ramah ala Aquarium Teles
    if (now - lastWarn >= WARN_COOLDOWN_MS) {
        warnCooldowns.set(userId, now);

        await message.reply({
            content: `«𓆝 𓆟» Eits <@${userId}>, jaga bahasanya yaa! Jangan ngomong kasar di aquarium virtual ini fishyyy~ Jaga airnya tetap bersih 🫧🧼💙`,
            allowedMentions: { repliedUser: false }
        }).catch(() => {});
    }

    return true;
}

module.exports = {
    BANNED_WORDS,
    hasBannedWord,
    handleBadWords
};
