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
    }
};