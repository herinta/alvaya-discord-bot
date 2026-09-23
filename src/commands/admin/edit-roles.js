const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder 
} = require('discord.js');
const { hasStaffAccess } = require('../../utils/permissions');
const { cleanRoleLabel } = require('../../handlers/customRoleHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('edit-roles')
        .setDescription('Edit judul, deskripsi, atau tombol pada panel role yang sudah ada')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('message_id')
                .setDescription('ID pesan panel role yang ingin diedit (Klik kanan pesan -> Copy Message ID)')
                .setRequired(true)
        ),

    async execute(interaction) {
        if (!hasStaffAccess(interaction)) {
            return interaction.reply({
                content: '❌ Kamu tidak memiliki izin untuk menggunakan perintah ini.',
                ephemeral: true
            });
        }

        const messageId = interaction.options.getString('message_id').trim();
        let targetMessage = null;

        try {
            targetMessage = await interaction.channel.messages.fetch(messageId);
        } catch {
            // Coba cari di channel lain di server jika tidak ketemu di channel saat ini
            for (const ch of interaction.guild.channels.cache.values()) {
                if (ch.isTextBased() && ch.id !== interaction.channelId) {
                    try {
                        targetMessage = await ch.messages.fetch(messageId);
                        if (targetMessage) break;
                    } catch {}
                }
            }
        }

        if (!targetMessage || targetMessage.author.id !== interaction.client.user.id) {
            return interaction.reply({
                content: '❌ Pesan panel tidak ditemukan atau bukan pesan yang dikirim oleh bot ini.',
                ephemeral: true
            });
        }

        const existingEmbed = targetMessage.embeds[0];
        const existingTitle = existingEmbed ? (existingEmbed.title || '') : '';
        const existingDesc = existingEmbed ? (existingEmbed.description || '') : '';
        const existingColor = existingEmbed && existingEmbed.hexColor ? existingEmbed.hexColor : '#29b6f6';

        const existingRolesLines = [];
        let existingMode = '0';

        for (const row of targetMessage.components) {
            for (const btn of row.components) {
                if (btn.customId) {
                    const emojiStr = btn.emoji ? (btn.emoji.id ? `<:${btn.emoji.name}:${btn.emoji.id}>` : btn.emoji.name) : '🏷️';
                    existingRolesLines.push(`${emojiStr} | ${cleanRoleLabel(btn.label || '')}`);
                    if (btn.customId.includes('exclusive')) {
                        existingMode = '1';
                    }
                }
            }
        }

        const modal = new ModalBuilder()
            .setCustomId(`modal_edit_roles_${targetMessage.channelId}_${targetMessage.id}`)
            .setTitle('Edit Panel Select Roles');

        const titleInput = new TextInputBuilder()
            .setCustomId('input_panel_title')
            .setLabel('Judul Panel')
            .setValue(existingTitle)
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const descInput = new TextInputBuilder()
            .setCustomId('input_panel_desc')
            .setLabel('Deskripsi Panel (Multi-baris)')
            .setValue(existingDesc)
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const rolesInput = new TextInputBuilder()
            .setCustomId('input_panel_roles')
            .setLabel('Tombol Role (Format: Emoji | Nama Role)')
            .setValue(existingRolesLines.length > 0 ? existingRolesLines.join('\n') : '✂️ | Clipper')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const modeInput = new TextInputBuilder()
            .setCustomId('input_panel_mode')
            .setLabel('Pilihan (0: Multi-select, 1: Single)')
            .setValue(existingMode)
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const colorInput = new TextInputBuilder()
            .setCustomId('input_panel_color')
            .setLabel('Warna Border Hex (Opsional)')
            .setValue(existingColor)
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(descInput),
            new ActionRowBuilder().addComponents(rolesInput),
            new ActionRowBuilder().addComponents(modeInput),
            new ActionRowBuilder().addComponents(colorInput)
        );

        return await interaction.showModal(modal);
    }
};
