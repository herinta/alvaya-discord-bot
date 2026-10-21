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

/**
 * Mengecek apakah teks mengandung kata terlarang
 * @param {string} text 
 * @returns {boolean}
 */
function hasBannedWord(text) {
    if (!text) return false;
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

    // Selalu kirim teguran ramah ala Aquarium Teles setiap kali ada kata kasar
    await message.reply({
        content: `«𓆝 𓆟» Eits <@${userId}>, jaga bahasanya yaa! Jangan ngomong kasar di aquarium virtual ini fishyyy~ Jaga airnya tetap bersih 🫧🧼💙`,
        allowedMentions: { repliedUser: false }
    }).catch(() => {});

    return true;
}

module.exports = {
    BANNED_WORDS,
    hasBannedWord,
    handleBadWords
};
