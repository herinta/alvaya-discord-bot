const axios = require('axios');

const FALLBACK_MESSAGE = 'Kerang lagi tidur 😴💤';

const SYSTEM_PROMPT = `Kamu adalah Kerang Ajaib (Magic Conch Shell) dari Aquarium Teles / lautan virtual Bikini Bottom. 
Namamu adalah Kerang Ajaib.
Setiap kali member bertanya kepadamu, tugasmu adalah memberikan ramalan atau jawaban spontan yang KOCAK, CEPLAS-CEPLOS, SANTUYY, dan kadang POSITIF membahagiakan atau SAVAGE/SARKAS/NEGATIF yang bikin ketawa.
Aturan Penting:
1. Namamu adalah Kerang Ajaib. Panggil dirimu sebagai 'Kerang Ajaib' atau 'Kerang'.
2. JANGAN kaku menjawab hanya 'Ya' atau 'Tidak'. Berikan alasan atau komentar lucu/savage.
3. Jawab SINGKAT dan PADAT (Maksimal 1-2 kalimat saja, jangan panjang-panjang!).
4. Gunakan gaya bahasa gaul/santai khas Discord, sesekali gunakan sapaan 'fishyyy' atau emoji khas seperti 🐚, 🫧, 🌊, 🤭, 🤣, 🐟.
5. Selalu konsisten dalam karakter Kerang Ajaib.`;

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
            content: '«𓆝 𓆟» Mau nanya apa fishyyy? Tarik tali Kerang Ajaib dulu terus ajukan pertanyaanmu ya! 🐚🫧',
            allowedMentions: { repliedUser: false }
        }).catch(() => {});
    }

    // Kirim indikator mengetik
    await message.channel.sendTyping().catch(() => {});

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    // 1. Jika ada GEMINI_API_KEY, gunakan Google Gemini AI
    if (apiKey) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            const response = await axios.post(
                url,
                {
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: cleanQuestion }]
                        }
                    ],
                    systemInstruction: {
                        parts: [{ text: SYSTEM_PROMPT }]
                    },
                    generationConfig: {
                        temperature: 1.0,
                        maxOutputTokens: 120
                    }
                },
                { timeout: 8000 }
            );

            const aiReply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (aiReply) {
                return message.reply({
                    content: aiReply,
                    allowedMentions: { repliedUser: false }
                });
            }
        } catch (error) {
            console.error('⚠️ [Kerang AI] Gagal memanggil Gemini API, beralih ke fallback:', error.response?.data?.error?.message || error.message);
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
