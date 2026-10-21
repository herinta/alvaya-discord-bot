const { GoogleGenAI } = require('@google/genai');

const FALLBACK_MESSAGE = 'Kerang lagi tidur 😴💤';

const SYSTEM_PROMPT = `Kamu adalah Kerang Ajaib (Magic Conch Shell) dari Aquarium Teles / lautan virtual Bikini Bottom. 
Namamu adalah Kerang Ajaib.
Setiap kali member bertanya kepadamu, tugasmu adalah memberikan ramalan atau jawaban spontan yang berfokus pada YA atau TIDAK yang kocak, ceplas-ceplos, santai, dan bervariasi antara positif dan negatif.

ATURAN UTAMA (WAJIB DIPATUHI):
1. FOKUS PADA TOPIK (DILARANG MENGALIHKAN TOPIK):
   - Jawablah TEPAT dan RELEVAN dengan topik yang ditanyakan member! Jika member bertanya tentang politik, jawablah tentang politik itu. Jika bertanya tentang makanan, game, atau cuaca, jawablah sesuai topik tersebut.
   - JANGAN PERNAH mengalihkan topik ke hal lain (seperti tiba-tiba membawa topik pacar, jodoh, atau cinta) jika member tidak menanyakannya!
2. KEPASTIAN JAWABAN (YA ATAU TIDAK):
   - Jawabanmu harus secara jelas menyatakan intinya: antara YA (positif) seperti "Iya dong...", "Tentu saja!", "Bisa jadi...", ATAU TIDAK (negatif) seperti "Nggak bakal...", "Mustahil dehh...", "Jelas tidak!".
   - Tambahkan komentar/alasan kocak atau savage yang TETAP NYAMBUNG dengan topik yang ditanyakan.
3. SINGKAT DAN PADAT:
   - Maksimal 1 sampai 2 kalimat saja.
4. SAPAAN:
   - Gunakan sapaan 'Fishies' untuk memanggil member, sertakan emoji khas seperti 🐚, 🫧, 🌊, 🤭, 🤣, 🐟.`;

const clientCache = new Map();
function getGenAiClient(apiKey) {
    if (!clientCache.has(apiKey)) {
        clientCache.set(apiKey, new GoogleGenAI({ apiKey }));
    }
    return clientCache.get(apiKey);
}

/**
 * Mendapatkan daftar API Key (utama + cadangan) dari environment variable
 * Mendukung beberapa key yang dipisahkan koma pada GEMINI_API_KEY atau GEMINI_API_KEYS
 * @returns {string[]}
 */
function getAvailableApiKeys() {
    const rawEnv = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
    return rawEnv
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);
}

/**
 * Handle chat saat bot di-tag untuk bertanya ke Kerang Ajaib
 * @param {import('discord.js').Message} message 
 */
async function handleKerangChat(message) {
    // Bersihkan tag/mention bot dari isi teks
    const botMentionRegex = new RegExp(`<@!?${message.client.user.id}>`, 'g');
    const cleanQuestion = message.content.replace(botMentionRegex, '').trim();

    // Jika cuma tag doang tanpa nanya
    if (!cleanQuestion || cleanQuestion.length < 2) {
        return message.reply({
            content: '«𓆝 𓆟» Mau nanya apa Fishies? Tarik tali Kerang Ajaib dulu terus ajukan pertanyaanmu ya! 🐚🫧',
            allowedMentions: { repliedUser: false }
        }).catch(() => {});
    }

    // Kirim indikator mengetik
    await message.channel.sendTyping().catch(() => {});

    const apiKeys = getAvailableApiKeys();
    const primaryModel = process.env.GEMINI_MODEL || 'models/gemini-3.1-flash-lite';

    // Coba setiap API Key yang tersedia berurutan jika ada yang limit
    for (let i = 0; i < apiKeys.length; i++) {
        const apiKey = apiKeys[i];
        try {
            const ai = getGenAiClient(apiKey);
            let interaction;
            try {
                interaction = await ai.interactions.create({
                    model: primaryModel,
                    input: cleanQuestion,
                    system_instruction: SYSTEM_PROMPT,
                });
            } catch (err) {
                // Jika model sibuk (503 high demand), gunakan model alternatif
                if (err.message?.includes('503') || err.message?.includes('high demand')) {
                    interaction = await ai.interactions.create({
                        model: 'models/gemini-3-flash-preview',
                        input: cleanQuestion,
                        system_instruction: SYSTEM_PROMPT,
                    });
                } else {
                    throw err;
                }
            }

            const aiReply = interaction?.output_text || interaction?.steps?.at(-1)?.content?.[0]?.text;
            if (aiReply) {
                return message.reply({
                    content: aiReply.trim(),
                    allowedMentions: { repliedUser: false }
                });
            }
        } catch (error) {
            console.warn(`⚠️ [Kerang AI] Key #${i + 1} limit/gagal: ${error.message}. Beralih ke key cadangan...`);
        }
    }

    // 2. Fallback tunggal jika API Key belum dipasang / error
    return message.reply({
        content: FALLBACK_MESSAGE,
        allowedMentions: { repliedUser: false }
    }).catch(() => {});
}

module.exports = {
    handleKerangChat
};
