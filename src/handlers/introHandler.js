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
 * Buat Embed Panel Panduan Introduction
 */
function createIntroPanelEmbed() {
    return new EmbedBuilder()
        .setColor('#00FFFF')
        .setTitle('🪪 MEMBER INTRODUCTION')
        .setDescription(
            'Halo Fishyyy! Kenalan yuk biar makin akrab di Aquarium Lele! 🫧💙\n\n' +
            'Silakan klik tombol **"Introduce"** di bawah ini untuk mengisi formulir perkenalan singkat dirimu.\n\n' +
            '📝 **Data yang diisi:**\n' +
            '• **Nickname**: Nama panggilanmu\n' +
            '• **Age**: Usia kamu\n' +
            '• **Hobby**: Hobi / Hal kesukaanmu\n' +
            '• **Game**: Game favorit yang kamu mainkan\n\n' +
            'Klik tombol di bawah untuk mulai mengisi! 👇'
        );
}

/**
 * Buat Tombol Trigger Form Introduction
 */
function createIntroButton() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('btn_intro_trigger')
            .setLabel('Introduce')
            .setEmoji('🪪')
            .setStyle(ButtonStyle.Primary)
    );
}

/**
 * Menampilkan popup modal saat tombol Introduce diklik
 */
async function handleIntroButton(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('modal_intro_submit')
        .setTitle('Formulir Introduction');

    const nickInput = new TextInputBuilder()
        .setCustomId('input_nickname')
        .setLabel('Nickname (Nama Panggilan)')
        .setPlaceholder('Contoh: Alva / Lele')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const ageInput = new TextInputBuilder()
        .setCustomId('input_age')
        .setLabel('Age (Umur)')
        .setPlaceholder('Contoh: 18 / Rahasia')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const hobbyInput = new TextInputBuilder()
        .setCustomId('input_hobby')
        .setLabel('Hobby')
        .setPlaceholder('Contoh: Menggambar, Nonton Anime, Dengerin Musik')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    const gameInput = new TextInputBuilder()
        .setCustomId('input_game')
        .setLabel('Game (Valorant, Roblox, dll)')
        .setPlaceholder('Contoh: Valorant, Roblox, Genshin, MLBB')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(nickInput),
        new ActionRowBuilder().addComponents(ageInput),
        new ActionRowBuilder().addComponents(hobbyInput),
        new ActionRowBuilder().addComponents(gameInput)
    );

    await interaction.showModal(modal);
}

/**
 * Helper untuk mendapatkan atau membuat webhook pengirim perkenalan
 */
async function getOrCreateIntroWebhook(channel, clientUser) {
    try {
        const webhooks = await channel.fetchWebhooks();
        let webhook = webhooks.find(w => w.owner?.id === clientUser.id) || webhooks.first();
        if (!webhook) {
            webhook = await channel.createWebhook({
                name: 'Alvaya Intro Dispatcher',
                avatar: clientUser.displayAvatarURL(),
                reason: 'Introduction message dispatcher'
            });
        }
        return webhook;
    } catch (error) {
        return null; // Fallback jika tidak ada permission Manage Webhooks
    }
}

/**
 * Menghandle submit modal perkenalan & auto-scroll panel ke baris paling bawah
 */
async function handleIntroModal(interaction) {
    const nickname = interaction.fields.getTextInputValue('input_nickname');
    const age = interaction.fields.getTextInputValue('input_age');
    const hobby = interaction.fields.getTextInputValue('input_hobby');
    const game = interaction.fields.getTextInputValue('input_game');

    const user = interaction.user;

    // Format Embed Kartu Perkenalan (dengan thumbnail avatar di samping kanan atas)
    const introEmbed = new EmbedBuilder()
        .setColor('#00FFFF')
        .setAuthor({ 
            name: `Member Introduction — ${user.displayName || user.username}`, 
            iconURL: user.displayAvatarURL() 
        })
        .setDescription(
            `Hai semuanya! Kenalan yuk sama <@${user.id}>~ 🫧💙\n\n` +
            `📛 **Nickname:** ${nickname}\n` +
            `🎂 **Age:** ${age}\n` +
            `🎨 **Hobby:** ${hobby}\n` +
            `🎮 **Game:** ${game}`
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setFooter({ text: `Member Introduction • ${user.tag}`, iconURL: user.displayAvatarURL() })
        .setTimestamp();

    const channel = interaction.channel;

    await interaction.deferReply({ ephemeral: true });

    // 1. Kirim Kartu Perkenalan menggunakan Webhook (Profil User di kiri) agar terpisah dari panel bot
    const webhook = await getOrCreateIntroWebhook(channel, interaction.client.user);
    if (webhook) {
        await webhook.send({
            username: user.displayName || user.username,
            avatarURL: user.displayAvatarURL({ dynamic: true, size: 256 }),
            embeds: [introEmbed]
        });
    } else {
        await channel.send({ 
            embeds: [introEmbed] 
        });
    }

    // 2. Hapus Panel Rules / Button yang lama jika ada
    try {
        const messages = await channel.messages.fetch({ limit: 10 });
        const oldPanel = messages.find(m => 
            m.author.id === interaction.client.user.id && 
            m.components.length > 0 &&
            m.components[0]?.components?.some(c => c.customId === 'btn_intro_trigger')
        );
        
        if (oldPanel) {
            await oldPanel.delete();
        }
    } catch (err) {
        console.log('Gagal menghapus panel intro lama:', err);
    }

    // 3. Kirim Panel Tombol BARU di paling bawah (Dengan Profil Bot di kiri & jarak terpisah)
    await channel.send({
        embeds: [createIntroPanelEmbed()],
        components: [createIntroButton()]
    });

    // 4. Kirim konfirmasi ephemeral ke user
    await interaction.editReply({ content: '✅ Perkenalan kamu berhasil dikirim!' });
}

module.exports = {
    createIntroPanelEmbed,
    createIntroButton,
    handleIntroButton,
    handleIntroModal
};
