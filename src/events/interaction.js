const { 
    Events, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle,
    PermissionFlagsBits 
} = require('discord.js');

// Fungsi pembantu untuk memvalidasi role Poseidon & Neptune
function hasStaffAccess(interaction) {
    if (!interaction.member) return false;
    
    // Server Owner & Administrator otomatis punya akses
    if (interaction.guild?.ownerId === interaction.user.id) return true;
    if (interaction.member.permissions?.has(PermissionFlagsBits.Administrator)) return true;
    
    // Cek Role Poseidon atau Neptune (termasuk jika nama role pakai emoji)
    return interaction.member.roles.cache.some(role => {
        const name = role.name.toLowerCase();
        return name.includes('poseidon') || name.includes('neptune');
    });
}

// Copy fungsi createRulesEmbed & createButton dari atas kesini juga ya,
// atau idealnya taruh di file 'utils.js', tapi kita copas aja biar cepet.
function createRulesEmbed() {
    return new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle('💬 CONFESSION')
        .setDescription(
            'Teks Channel ini berfungsi untuk mengirimkan pesan teks anonim.\n\n' +
            '⚠️ **PERATURAN WAJIB DIPATUHI**\n' +
            '🚫 **Dilarang menyebut nama** seseorang secara langsung/tak langsung.\n' +
            '❌ **Dilarang DOXING** (Menyebut info pribadi, sekolah, alamat).\n' +
            '🔥 **Dilarang Provokasi** atau ujaran kebencian.\n\n' +
            'Klik tombol di bawah untuk mulai curhat! 👇'
        );
        // .setImage(...) // Masukin gambar bannermu disini
}

function createButton() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('btn_confess_trigger')
            .setLabel('Confession')
            .setEmoji('💬')
            .setStyle(ButtonStyle.Primary)
    );
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        
        // --- A. KALO USER KLIK TOMBOL "CONFESSION" ---
        if (interaction.isButton() && interaction.customId === 'btn_confess_trigger') {
            
            // Bikin Form Modal
            const modal = new ModalBuilder()
                .setCustomId('modal_confess_submit')
                .setTitle('Formulir Confession');

            // Input 1: Pesan Curhat
            const messageInput = new TextInputBuilder()
                .setCustomId('input_message')
                .setLabel("Apa curhatanmu?")
                .setStyle(TextInputStyle.Paragraph) // Kotak besar
                .setRequired(true);

            // Input 2: Pilihan Anonim (Karena Modal gabisa Dropdown/Button)
            const anonInput = new TextInputBuilder()
                .setCustomId('input_anon')
                .setLabel("Anonim? (Ketik: Ya / Tidak)")
                .setPlaceholder("Ya")
                .setStyle(TextInputStyle.Short)
                .setRequired(false); // Boleh kosong (default Ya)

            // Masukin ke baris
            const row1 = new ActionRowBuilder().addComponents(messageInput);
            const row2 = new ActionRowBuilder().addComponents(anonInput);

            modal.addComponents(row1, row2);

            // Tampilin Modal ke User
            await interaction.showModal(modal);
        }

        // --- B. KALO USER UDAH ISI & KLIK SUBMIT ---
        if (interaction.isModalSubmit() && interaction.customId === 'modal_confess_submit') {
            
            // 1. Ambil data dari form
            const content = interaction.fields.getTextInputValue('input_message');
            let isAnonInput = interaction.fields.getTextInputValue('input_anon').toLowerCase();
            
            // Logic Anonim (Default Ya, kecuali dia ketik 'tidak' atau 'no')
            let isAnon = true;
            if (isAnonInput.includes('tidak') || isAnonInput.includes('no') || isAnonInput.includes('ga')) {
                isAnon = false;
            }

            // 2. Siapkan Embed Hasil Curhat
            const confessEmbed = new EmbedBuilder()
                .setColor(isAnon ? '#ff0000' : '#00ff00') // Merah kalo Anon, Hijau kalo Engga
                .setTitle(isAnon ? '🕵️ Anonymous Confession' : `📢 Confession dari ${interaction.user.username}`)
                .setDescription(content)
                .setTimestamp();
            
            if (!isAnon) {
                confessEmbed.setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() });
            } else {
                confessEmbed.setFooter({ text: 'Pengirim Rahasia' });
            }

            // 3. PROSES KIRIM & PINDAHIN RULES (Auto-Scroll Logic)
            const channel = interaction.channel;

            await interaction.deferReply({ ephemeral: true }); // Kasih tau bot lagi mikir (biar ga error timeout)

            // A. Kirim Confess-nya dulu
            await channel.send({ embeds: [confessEmbed] });

            // B. Hapus Panel Rules yang lama (Cari pesan terakhir bot yang ada tombolnya)
            try {
                // Ambil 10 pesan terakhir
                const messages = await channel.messages.fetch({ limit: 10 });
                // Cari pesan punya bot KITA, yang ada tombolnya
                const oldPanel = messages.find(m => m.author.id === interaction.client.user.id && m.components.length > 0);
                
                if (oldPanel) {
                    await oldPanel.delete(); // Hapus panel lama
                }
            } catch (err) {
                console.log("Gagal hapus pesan lama:", err);
            }

            // C. Kirim Panel Rules BARU (Jadi otomatis ada di paling bawah)
            await channel.send({
                embeds: [createRulesEmbed()],
                components: [createButton()]
            });

            // 4. Kasih konfirmasi ke user (Cuma dia yang liat)
            await interaction.editReply({ content: '✅ Confession kamu berhasil terkirim!' });
        }

        // --- C. KALO USER PAKAI COMMAND /announce ---
        if (interaction.isChatInputCommand() && interaction.commandName === 'announce') {
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
        }

        // --- D. KALO USER SUBMIT MODAL ANNOUNCEMENT EMBED ---
        if (interaction.isModalSubmit() && interaction.customId === 'modal_announce_embed') {
            const titleInput = (interaction.fields.getTextInputValue('announce_title') || '').trim();
            const messageContent = interaction.fields.getTextInputValue('announce_message');
            const imageInput = (interaction.fields.getTextInputValue('announce_image') || '').trim();

            try {
                const embed = new EmbedBuilder()
                    .setColor('#00FFFF') // Default Cyan
                    .setDescription(messageContent)
                    .setTimestamp();

                if (titleInput) {
                    embed.setTitle(titleInput);
                }

                if (imageInput) {
                    try {
                        new URL(imageInput);
                        embed.setImage(imageInput);
                    } catch {
                        // Abaikan jika URL tidak valid
                    }
                }

                // Cek jika ada mention @everyone / @here biar notifnya masuk
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
        }

        // --- E. KALO USER SUBMIT MODAL ANNOUNCEMENT TEKS BIASA ---
        if (interaction.isModalSubmit() && interaction.customId === 'modal_announce_biasa') {
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

        // --- F. KALO USER PAKAI COMMAND /edit-message ---
        if (interaction.isChatInputCommand() && interaction.commandName === 'edit-message') {
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
        }

        // --- G. KALO USER SUBMIT MODAL EDIT EMBED ---
        if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_edit_embed_')) {
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
                    } catch {
                        // Abaikan jika URL tidak valid
                    }
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
        }

        // --- H. KALO USER SUBMIT MODAL EDIT TEKS BIASA ---
        if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_edit_biasa_')) {
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