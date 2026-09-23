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
        .setName('announce')
        .setDescription('Buat pengumuman (Multi-baris / Embed / Teks biasa)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('tipe')
                .setDescription('Pilih tampilan pengumuman (Embed / Teks Biasa)')
                .setRequired(true)
                .addChoices(
                    { name: '📦 Embed (Kotak dengan Warna & Judul)', value: 'embed' },
                    { name: '📝 Teks Biasa (Pesan Standar)', value: 'biasa' }
                )
        ),

    async execute(interaction) {
        if (!hasStaffAccess(interaction)) {
            return await interaction.reply({
                content: '❌ Kamu tidak memiliki izin untuk menggunakan perintah ini! Hanya role **Poseidon** & **Neptune** yang dapat menggunakannya.',
                ephemeral: true
            });
        }

        const tipe = interaction.options.getString('tipe') || 'embed';

        if (tipe === 'embed') {
            const modal = new ModalBuilder()
                .setCustomId('modal_announce_embed')
                .setTitle('📢 Pengumuman Embed (Kotak)');

            const titleInput = new TextInputBuilder()
                .setCustomId('announce_title')
                .setLabel('Judul Pengumuman (Opsional)')
                .setPlaceholder('Contoh: 📢 INFORMASI PENTING!')
                .setStyle(TextInputStyle.Short)
                .setRequired(false);

            const messageInput = new TextInputBuilder()
                .setCustomId('announce_message')
                .setLabel('Isi Pengumuman (Bisa Enter / Multi-baris)')
                .setPlaceholder('Tulis pesan pengumumanmu di sini...\nBisa enter beberapa baris & pakai emoji!')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const imageInput = new TextInputBuilder()
                .setCustomId('announce_image')
                .setLabel('Link Gambar / Banner URL (Opsional)')
                .setPlaceholder('https://i.imgur.com/example.png')
                .setStyle(TextInputStyle.Short)
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(messageInput),
                new ActionRowBuilder().addComponents(imageInput)
            );

            return await interaction.showModal(modal);
        } else {
            const modal = new ModalBuilder()
                .setCustomId('modal_announce_biasa')
                .setTitle('📝 Pengumuman Teks Biasa');

            const messageInput = new TextInputBuilder()
                .setCustomId('announce_message')
                .setLabel('Isi Pesan (Bisa Enter / Multi-baris)')
                .setPlaceholder('Tulis pesan pengumuman teks biasa di sini...')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const imageInput = new TextInputBuilder()
                .setCustomId('announce_image')
                .setLabel('Link Gambar / Lampiran (Opsional)')
                .setPlaceholder('https://i.imgur.com/example.png')
                .setStyle(TextInputStyle.Short)
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(messageInput),
                new ActionRowBuilder().addComponents(imageInput)
            );

            return await interaction.showModal(modal);
        }
    },

    // Handler ketika modal disubmit
    async handleModal(interaction) {
        if (interaction.customId === 'modal_announce_embed') {
            const titleInput = (interaction.fields.getTextInputValue('announce_title') || '').trim();
            const messageContent = interaction.fields.getTextInputValue('announce_message');
            const imageInput = (interaction.fields.getTextInputValue('announce_image') || '').trim();

            try {
                const embed = new EmbedBuilder()
                    .setColor('#00FFFF')
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

                let ping = null;
                if (messageContent.includes('@everyone') || titleInput.includes('@everyone')) {
                    ping = '@everyone';
                } else if (messageContent.includes('@here') || titleInput.includes('@here')) {
                    ping = '@here';
                }

                await interaction.channel.send({
                    content: ping,
                    embeds: [embed]
                });

                await interaction.reply({ 
                    content: '✅ Pengumuman Embed berhasil dikirim ke channel ini!', 
                    ephemeral: true 
                });
            } catch (error) {
                console.error('❌ Gagal mengirim pengumuman embed:', error);
                await interaction.reply({ 
                    content: '❌ Gagal mengirim pengumuman. Pastikan bot memiliki izin kirim pesan & tautan di channel ini.', 
                    ephemeral: true 
                });
            }
        } else if (interaction.customId === 'modal_announce_biasa') {
            const messageContent = interaction.fields.getTextInputValue('announce_message');
            const imageInput = (interaction.fields.getTextInputValue('announce_image') || '').trim();

            try {
                const sendPayload = { content: messageContent };
                if (imageInput) {
                    sendPayload.files = [imageInput];
                }

                await interaction.channel.send(sendPayload);

                await interaction.reply({ 
                    content: '✅ Pengumuman Teks Biasa berhasil dikirim ke channel ini!', 
                    ephemeral: true 
                });
            } catch (error) {
                console.error('❌ Gagal mengirim pengumuman teks biasa:', error);
                await interaction.reply({ 
                    content: '❌ Gagal mengirim pengumuman. Pastikan bot memiliki izin kirim pesan di channel ini.', 
                    ephemeral: true 
                });
            }
        }
    }
};
