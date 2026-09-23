const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle 
} = require('discord.js');

/**
 * Buat Embed Peraturan Confession
 */
function createRulesEmbed() {
    return new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle('💬 CONFESSION')
        .setDescription(
            'Teks Channel ini berfungsi untuk mengirimkan pesan teks anonim.\n\n' +
            '⚠️ **PERATURAN WAJIB DIPATUHI**\n' +
            '🚫 **Dilarang menyebut nama** seseorang secara langsung/tak langsung.\n' +
            '❌ **Dilarang DOXING** (Menyebut info pribadi, sekolah, alamat).\n' +
            '🔥 **Dilarang Provokasi** atau ujaran kebencian.\n' +
            '🔍 **Dilarang menebak** identitas pengirim.\n\n' +
            'Klik tombol di bawah untuk mulai curhat! 👇'
        );
}

/**
 * Buat Tombol Trigger Form Confession
 */
function createConfessButton() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('btn_confess_trigger')
            .setLabel('Confession')
            .setEmoji('💬')
            .setStyle(ButtonStyle.Primary)
    );
}

/**
 * Menampilkan popup modal saat tombol Confession diklik
 */
async function handleConfessButton(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('modal_confess_submit')
        .setTitle('Formulir Confession');

    const messageInput = new TextInputBuilder()
        .setCustomId('input_message')
        .setLabel("Apa curhatanmu?")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    const anonInput = new TextInputBuilder()
        .setCustomId('input_anon')
        .setLabel("Anonim? (Ketik: Ya / Tidak)")
        .setPlaceholder("Ya")
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

    modal.addComponents(
        new ActionRowBuilder().addComponents(messageInput),
        new ActionRowBuilder().addComponents(anonInput)
    );

    await interaction.showModal(modal);
}

/**
 * Menghandle submit modal curhat & auto-scroll panel rules ke paling bawah
 */
async function handleConfessModal(interaction) {
    const content = interaction.fields.getTextInputValue('input_message');
    let isAnonInput = (interaction.fields.getTextInputValue('input_anon') || '').toLowerCase();
    
    let isAnon = true;
    if (isAnonInput.includes('tidak') || isAnonInput.includes('no') || isAnonInput.includes('ga')) {
        isAnon = false;
    }

    const confessEmbed = new EmbedBuilder()
        .setColor(isAnon ? '#ff0000' : '#00ff00')
        .setTitle(isAnon ? '🕵️ Anonymous Confession' : `📢 Confession dari ${interaction.user.username}`)
        .setDescription(content)
        .setTimestamp();
    
    if (!isAnon) {
        confessEmbed.setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() });
    } else {
        confessEmbed.setFooter({ text: 'Pengirim Rahasia' });
    }

    const channel = interaction.channel;

    await interaction.deferReply({ ephemeral: true });

    // 1. Kirim Confess
    await channel.send({ embeds: [confessEmbed] });

    // 2. Hapus Panel Rules yang lama
    try {
        const messages = await channel.messages.fetch({ limit: 10 });
        const oldPanel = messages.find(m => m.author.id === interaction.client.user.id && m.components.length > 0);
        
        if (oldPanel) {
            await oldPanel.delete();
        }
    } catch (err) {
        console.log("Gagal hapus pesan rules lama:", err);
    }

    // 3. Kirim Panel Rules baru di paling bawah
    await channel.send({
        embeds: [createRulesEmbed()],
        components: [createConfessButton()]
    });

    await interaction.editReply({ content: '✅ Confession kamu berhasil terkirim!' });
}

module.exports = {
    createRulesEmbed,
    createConfessButton,
    handleConfessButton,
    handleConfessModal
};
