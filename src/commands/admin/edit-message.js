const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder, 
    EmbedBuilder 
} = require('discord.js');
const { hasStaffAccess } = require('../../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('edit-message')
        .setDescription('Edit pesan atau pengumuman yang pernah dikirim oleh bot')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('message_id')
                .setDescription('ID pesan bot yang ingin diedit (Klik kanan pesan -> Copy Message ID)')
                .setRequired(true)
        ),

    async execute(interaction) {
        if (!hasStaffAccess(interaction)) {
            return await interaction.reply({
                content: '❌ Kamu tidak memiliki izin untuk menggunakan perintah ini! Hanya role **Poseidon** & **Neptune** yang dapat menggunakannya.',
                ephemeral: true
            });
        }

        const messageId = interaction.options.getString('message_id').trim();

        let targetMessage;
        try {
            targetMessage = await interaction.channel.messages.fetch(messageId);
        } catch (err) {
            return await interaction.reply({
                content: '❌ Pesan dengan ID tersebut tidak ditemukan di channel ini! Pastikan ID benar dan kamu menjalankan command ini di channel tempat pesan itu berada.',
                ephemeral: true
            });
        }

        if (targetMessage.author.id !== interaction.client.user.id) {
            return await interaction.reply({
                content: '❌ Bot hanya bisa mengedit pesan yang dikirim oleh bot itu sendiri!',
                ephemeral: true
            });
        }

        // Cek apakah pesan berupa Embed atau Teks Biasa
        if (targetMessage.embeds.length > 0) {
            const existingEmbed = targetMessage.embeds[0];
            const existingTitle = (existingEmbed.title || '').slice(0, 256);
            const existingDescription = (existingEmbed.description || '').slice(0, 4000);
            const existingImage = (existingEmbed.image?.url || '').slice(0, 256);

            const modal = new ModalBuilder()
                .setCustomId(`modal_edit_embed_${messageId}`)
                .setTitle('✏️ Edit Pesan Embed');

            const titleInput = new TextInputBuilder()
                .setCustomId('edit_title')
                .setLabel('Judul Pengumuman (Opsional)')
                .setPlaceholder('Contoh: 📢 INFORMASI PENTING!')
                .setStyle(TextInputStyle.Short)
                .setRequired(false);
            if (existingTitle) titleInput.setValue(existingTitle);

            const messageInput = new TextInputBuilder()
                .setCustomId('edit_message')
                .setLabel('Isi Pengumuman (Bisa Multi-baris)')
                .setPlaceholder('Tulis isi pesan...')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);
            if (existingDescription) messageInput.setValue(existingDescription);

            const imageInput = new TextInputBuilder()
                .setCustomId('edit_image')
                .setLabel('Link Gambar / Banner URL (Opsional)')
                .setPlaceholder('https://i.imgur.com/example.png')
                .setStyle(TextInputStyle.Short)
                .setRequired(false);
            if (existingImage) imageInput.setValue(existingImage);

            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(messageInput),
                new ActionRowBuilder().addComponents(imageInput)
            );

            return await interaction.showModal(modal);
        } else {
            const existingContent = (targetMessage.content || '').slice(0, 4000);

            const modal = new ModalBuilder()
                .setCustomId(`modal_edit_biasa_${messageId}`)
                .setTitle('✏️ Edit Pesan Teks');

            const messageInput = new TextInputBuilder()
                .setCustomId('edit_message')
                .setLabel('Isi Pesan (Bisa Multi-baris)')
                .setPlaceholder('Tulis isi pesan baru...')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);
            if (existingContent) messageInput.setValue(existingContent);

            modal.addComponents(
                new ActionRowBuilder().addComponents(messageInput)
            );

            return await interaction.showModal(modal);
        }
    },

    // Handler ketika modal edit disubmit
    async handleModal(interaction) {
        if (interaction.customId.startsWith('modal_edit_embed_')) {
            const messageId = interaction.customId.replace('modal_edit_embed_', '');
            const titleInput = (interaction.fields.getTextInputValue('edit_title') || '').trim();
            const messageContent = interaction.fields.getTextInputValue('edit_message');
            const imageInput = (interaction.fields.getTextInputValue('edit_image') || '').trim();

            try {
                const targetMessage = await interaction.channel.messages.fetch(messageId);
                const existingColor = targetMessage.embeds[0]?.color || '#00FFFF';

                const embed = new EmbedBuilder()
                    .setColor(existingColor)
                    .setDescription(messageContent)
                    .setTimestamp();

                if (titleInput) {
                    embed.setTitle(titleInput);
                }

                if (imageInput) {
                    try {
                        new URL(imageInput);
                        embed.setImage(imageInput);
                    } catch {}
                }

                await targetMessage.edit({
                    embeds: [embed]
                });

                await interaction.reply({
                    content: '✅ Pesan embed berhasil diperbarui!',
                    ephemeral: true
                });
            } catch (error) {
                console.error('❌ Gagal mengedit pengumuman embed:', error);
                await interaction.reply({
                    content: '❌ Gagal mengedit pesan. Pastikan bot memiliki izin yang cukup dan pesan belum terhapus.',
                    ephemeral: true
                });
            }
        } else if (interaction.customId.startsWith('modal_edit_biasa_')) {
            const messageId = interaction.customId.replace('modal_edit_biasa_', '');
            const messageContent = interaction.fields.getTextInputValue('edit_message');

            try {
                const targetMessage = await interaction.channel.messages.fetch(messageId);

                await targetMessage.edit({
                    content: messageContent,
                    allowedMentions: { parse: ['everyone', 'roles', 'users'] }
                });

                await interaction.reply({
                    content: '✅ Pesan teks biasa berhasil diperbarui!',
                    ephemeral: true
                });
            } catch (error) {
                console.error('❌ Gagal mengedit pengumuman teks biasa:', error);
                await interaction.reply({
                    content: '❌ Gagal mengedit pesan. Pastikan bot memiliki izin yang cukup dan pesan belum terhapus.',
                    ephemeral: true
                });
            }
        }
    }
};
