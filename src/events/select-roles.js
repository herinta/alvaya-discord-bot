const { 
    Events, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');

// Channel ID bisa diambil dari .env atau default ID yang diberikan
const SELECT_ROLES_CHANNEL_ID = process.env.SELECT_ROLES_CHANNEL_ID || '1472826120008106138';

// Konfigurasi Role
const ROLE_CONFIGS = {
    // 1. Gender Roles (Exclusive: pilih salah satu)
    role_fishie_boy: {
        name: 'Jantan',
        aliases: ['jantan', 'fishie boy'],
        group: 'gender',
        opposite: 'role_fishie_girl',
        emoji: '🐟'
    },
    role_fishie_girl: {
        name: 'Betina',
        aliases: ['betina', 'fishie girl'],
        group: 'gender',
        opposite: 'role_fishie_boy',
        emoji: '🧜‍♀️'
    },

    // 2. Age Stage Roles (Exclusive: pilih salah satu)
    role_baby_fish: {
        name: 'Baby Fish',
        aliases: ['baby fish', 'under 18', '<18', '< 18'],
        group: 'age',
        opposite: 'role_adult_fish',
        emoji: '🐥'
    },
    role_adult_fish: {
        name: 'Adult Fish',
        aliases: ['adult fish', '18+'],
        group: 'age',
        opposite: 'role_baby_fish',
        emoji: '🐳'
    },

    // 3. Creator Roles (Multi-choice / Bebas pilih lebih dari satu)
    role_clipper: {
        name: 'Clipper',
        aliases: ['clipper'],
        group: 'creator',
        emoji: '✂️'
    },
    role_artist: {
        name: 'Artist',
        aliases: ['artist'],
        group: 'creator',
        emoji: '🎨'
    },
    role_editor: {
        name: 'Editor',
        aliases: ['editor'],
        group: 'creator',
        emoji: '🎬'
    }
};

/**
 * Fungsi untuk mencari Role di Server berdasarkan nama/alias (toleran terhadap emoji/huruf besar-kecil)
 */
function findGuildRole(guild, config) {
    if (!config) return null;
    const aliases = config.aliases || [config.name.toLowerCase()];
    return guild.roles.cache.find(r => {
        const roleName = r.name.toLowerCase();
        return aliases.some(alias => roleName.includes(alias.toLowerCase()));
    });
}

/**
 * Fungsi pembangun panel pesan Select Roles (Embeds + Buttons)
 */
function createSelectRolesPanels() {
    // 1. Panel Gender
    const genderEmbed = new EmbedBuilder()
        .setColor('#29b6f6') // Biru cerah / Aqua
        .setTitle('🫧・Who are you, Fishies? 🐠')
        .setDescription(
            'Kamu ikan jantan atau betina nih? 👀💙\n' +
            'Pilih sesuai dirimu, yaa!\n\n' +
            '🐟・**JANTAN** — Fishie Boy\n' +
            '🧜‍♀️・**BETINA** — Fishie Girl\n\n' +
            '*Untuk Fishie Girl, jangan lupa verifikasi ke Admin dulu yaa~* 💌'
        );

    const genderRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('role_fishie_boy')
            .setLabel('Fishie Boy')
            .setEmoji('🐟')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('role_fishie_girl')
            .setLabel('Fishie Girl')
            .setEmoji('🧜‍♀️')
            .setStyle(ButtonStyle.Primary)
    );

    // 2. Panel Age / Stage
    const ageEmbed = new EmbedBuilder()
        .setColor('#29b6f6')
        .setTitle('🫧・What stage are you in, Fishies? 🐟')
        .setDescription(
            'Biar airnya tetap nyaman dan aman untuk semua Fishies~ 🐟💙\n' +
            'Pilih role sesuai kelompok umurmu yaa!\n\n' +
            '🐥 **Baby Fish** — Under 18\n' +
            '🐳 **Adult Fish** — 18+\n\n' +
            '*Role ini digunakan untuk membantu menjaga interaksi tetap sesuai usia. Jangan asal pilih role yaa~* 🫧'
        );

    const ageRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('role_baby_fish')
            .setLabel('Baby Fish')
            .setEmoji('🐥')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('role_adult_fish')
            .setLabel('Adult Fish')
            .setEmoji('🐳')
            .setStyle(ButtonStyle.Primary)
    );

    // 3. Panel Creator / Talent
    const creatorEmbed = new EmbedBuilder()
        .setColor('#29b6f6')
        .setTitle('🫧・What do you create, Fishies? 🐟')
        .setDescription(
            'Pilih role yang paling menggambarkan keahlianmu~ 🫧\n\n' +
            '✂️ **Clipper** — Membuat clip\n' +
            '🎨 **Artist** — Menggambar / Ilustrasi\n' +
            '🎬 **Editor** — Video / photo editing'
        );

    const creatorRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('role_clipper')
            .setLabel('Clipper')
            .setEmoji('✂️')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('role_artist')
            .setLabel('Artist')
            .setEmoji('🎨')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('role_editor')
            .setLabel('Editor')
            .setEmoji('🎬')
            .setStyle(ButtonStyle.Primary)
    );

    return [
        { embeds: [genderEmbed], components: [genderRow] },
        { embeds: [ageEmbed], components: [ageRow] },
        { embeds: [creatorEmbed], components: [creatorRow] }
    ];
}

function hasStaffAccess(interaction) {
    if (!interaction.member) return false;
    if (interaction.guild?.ownerId === interaction.user.id) return true;
    if (interaction.member.permissions?.has('Administrator')) return true;
    return interaction.member.roles.cache.some(role => {
        const name = role.name.toLowerCase();
        return name.includes('poseidon') || name.includes('neptune');
    });
}

module.exports = {
    name: Events.InteractionCreate,
    createSelectRolesPanels,
    SELECT_ROLES_CHANNEL_ID,
    async execute(interaction) {
        // ==========================================
        // 1. HANDLER SLASH COMMAND: /setup-roles
        // ==========================================
        if (interaction.isChatInputCommand() && interaction.commandName === 'setup-roles') {
            if (!hasStaffAccess(interaction)) {
                return interaction.reply({
                    content: '❌ Kamu tidak memiliki izin untuk menggunakan perintah ini.',
                    ephemeral: true
                });
            }

            const channelOption = interaction.options.getChannel('channel');
            const targetChannel = channelOption || interaction.guild.channels.cache.get(SELECT_ROLES_CHANNEL_ID) || interaction.channel;

            if (!targetChannel) {
                return interaction.reply({
                    content: '❌ Channel tujuan tidak ditemukan.',
                    ephemeral: true
                });
            }

            try {
                const panels = createSelectRolesPanels();
                for (const panel of panels) {
                    await targetChannel.send(panel);
                }

                return interaction.reply({
                    content: `✅ Panel Select Roles berhasil dikirim ke ${targetChannel}!`,
                    ephemeral: true
                });
            } catch (error) {
                console.error('❌ Gagal mengirim panel select-roles:', error);
                return interaction.reply({
                    content: `❌ Gagal mengirim panel: ${error.message}`,
                    ephemeral: true
                });
            }
        }

        // ==========================================
        // 2. HANDLER BUTTON INTERACTION: role_*
        // ==========================================
        if (!interaction.isButton() || !interaction.customId.startsWith('role_')) return;

        const config = ROLE_CONFIGS[interaction.customId];
        if (!config) return;

        const member = interaction.member;
        const guild = interaction.guild;

        if (!member || !guild) {
            return interaction.reply({ 
                content: '❌ Terjadi kesalahan saat membaca data member.', 
                ephemeral: true 
            });
        }

        // Cari role target di server
        const targetRole = findGuildRole(guild, config);
        if (!targetRole) {
            return interaction.reply({
                content: `❌ Role **${config.name}** belum ditemukan di server ini. Pastikan nama role mengandung kata "${config.name}".`,
                ephemeral: true
            });
        }

        // Cek hirarki role bot vs target role
        const botMember = guild.members.me;
        if (botMember && targetRole.position >= botMember.roles.highest.position) {
            return interaction.reply({
                content: `⚠️ Bot tidak memiliki izin untuk memasang role **${targetRole.name}** karena posisi role bot berada di bawah role tersebut di Server Settings. Silakan geser role Bot ke posisi lebih tinggi.`,
                ephemeral: true
            });
        }

        try {
            const hasRole = member.roles.cache.has(targetRole.id);

            // Jika user sudah punya role ini -> Lepas role (Toggle OFF)
            if (hasRole) {
                await member.roles.remove(targetRole);
                return interaction.reply({
                    content: `🗑️ Role ${config.emoji} **${targetRole.name}** telah dihapus dari profilmu.`,
                    ephemeral: true
                });
            }

            // Jika grupnya butuh eksklusif (Gender & Age: hanya boleh 1 role)
            if (config.opposite) {
                const oppositeConfig = ROLE_CONFIGS[config.opposite];
                if (oppositeConfig) {
                    const oppositeRole = findGuildRole(guild, oppositeConfig);
                    if (oppositeRole && member.roles.cache.has(oppositeRole.id)) {
                        await member.roles.remove(oppositeRole);
                    }
                }
            }

            // Tambahkan role ke user (Toggle ON)
            await member.roles.add(targetRole);
            return interaction.reply({
                content: `✅ Kamu berhasil mendapatkan role ${config.emoji} **${targetRole.name}**!`,
                ephemeral: true
            });

        } catch (error) {
            console.error(`❌ Error saat mengatur role ${config.name}:`, error);
            return interaction.reply({
                content: `❌ Gagal memperbarui role: ${error.message}`,
                ephemeral: true
            });
        }
    }
};
