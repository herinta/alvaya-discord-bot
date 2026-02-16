const { 
    Events, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle 
} = require('discord.js');

// --- CONFIG ---
const CONFESS_CHANNEL_ID = '1472837735470600192'; 

// Fungsi buat bikin Embed Rules (Biar bisa dipanggil ulang)
function createRulesEmbed() {
    return new EmbedBuilder()
        .setColor('#2b2d31') // Warna abu gelap ala Discord
        .setTitle('💬 CONFESSION')
        .setDescription(
            'Teks Channel ini berfungsi untuk mengirimkan pesan teks anonim.\n\n' +
            '⚠️ **PERATURAN WAJIB DIPATUHI**\n' +
            '🚫 **Dilarang menyebut nama** seseorang secara langsung/tak langsung.\n' +
            '❌ **Dilarang DOXING** (Menyebut info pribadi, sekolah, alamat).\n' +
            '🔥 **Dilarang Provokasi** atau ujaran kebencian.\n' +
            '🔍 **Dilarang menebak** identitas pengirim.\n\n' +
            'Klik tombol di bawah untuk mulai curhat! 👇'
        )
        .setImage('https://media.discordapp.net/attachments/123/banner-confess.png'); // Ganti link gambar banner kamu
}

// Fungsi buat bikin Tombol (Biar bisa dipanggil ulang)
function createButton() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('btn_confess_trigger')
                .setLabel('Confession')
                .setEmoji('💬')
                .setStyle(ButtonStyle.Primary)
        );
}

module.exports = {
    name: Events.MessageCreate, // Kita pake trigger message biasa dulu
    async execute(messageOrInteraction) {
        
        // --- 1. SETUP AWAL (Trigger pake command !setupconfess) ---
        // Cek apakah ini pesan biasa dan isinya !setupconfess
        if (messageOrInteraction.content === '!setupconfess') {
            // Hapus pesan command usernya biar bersih
            await messageOrInteraction.delete().catch(() => {});

            const channel = messageOrInteraction.channel;
            
            // Kirim Panel Rules pertama kali
            await channel.send({
                embeds: [createRulesEmbed()],
                components: [createButton()]
            });
            return;
        }
    }
};

