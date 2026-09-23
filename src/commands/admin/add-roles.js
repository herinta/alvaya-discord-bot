const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder 
} = require('discord.js');
const { hasStaffAccess } = require('../../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-roles')
        .setDescription('Buat panel select roles kustom lewat formulir modal (popup)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel tempat panel akan dikirim (Opsional, default: channel ini)')
                .setRequired(false)
        ),

    async execute(interaction) {
        if (!hasStaffAccess(interaction)) {
            return interaction.reply({
                content: '❌ Kamu tidak memiliki izin untuk menggunakan perintah ini.',
                ephemeral: true
            });
        }

        const channelOption = interaction.options.getChannel('channel');
        const targetChannelId = channelOption ? channelOption.id : interaction.channelId;

        // Bikin Popup Form Modal
        const modal = new ModalBuilder()
            .setCustomId(`modal_add_roles_${targetChannelId}`)
            .setTitle('Buat Panel Select Roles');

        const titleInput = new TextInputBuilder()
            .setCustomId('input_panel_title')
            .setLabel('Judul Panel')
            .setPlaceholder('🫧・What do you create, Fishies? 🐟')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const descInput = new TextInputBuilder()
            .setCustomId('input_panel_desc')
            .setLabel('Deskripsi Panel (Multi-baris)')
            .setPlaceholder('Pilih role yang paling menggambarkan dirimu / keahlianmu~ 🫧')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const rolesInput = new TextInputBuilder()
            .setCustomId('input_panel_roles')
            .setLabel('Tombol Role (Format: Emoji | Nama Role)')
            .setPlaceholder('✂️ | Clipper\n🎨 | Artist\n🎬 | Editor')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const modeInput = new TextInputBuilder()
            .setCustomId('input_panel_mode')
            .setLabel('Pilihan (0: Multi-select, 1: Single)')
            .setPlaceholder('0 = Multi-select, 1 = Single-select')
            .setValue('0')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const colorInput = new TextInputBuilder()
            .setCustomId('input_panel_color')
            .setLabel('Warna Border Hex (Opsional)')
            .setPlaceholder('#29b6f6')
            .setValue('#29b6f6')
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
