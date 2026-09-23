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

// Channel ID bisa diambil dari .env atau default ID yang diberikan
const SELECT_ROLES_CHANNEL_ID = process.env.SELECT_ROLES_CHANNEL_ID || '1472826120008106138';

// Konfigurasi Role Bawaan (Default Preset Panels)
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
 * Fungsi pembantu untuk mencari role berdasarkan string nama umum
 */
function findRoleByName(guild, rawName) {
    if (!rawName || !guild) return null;
    const clean = rawName.trim().toLowerCase();
    return guild.roles.cache.find(r => {
        const rName = r.name.toLowerCase();
        return rName === clean || rName.includes(clean) || clean.includes(rName);
    });
}

/**
 * Fungsi pembangun panel pesan Select Roles bawaan (Embeds + Buttons)
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

/**
 * Parser pintar untuk membaca baris role dari form modal
 */
function parseRoleLines(rawText) {
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const results = [];

    for (const line of lines) {
        if (line.includes('|')) {
            const parts = line.split('|').map(p => p.trim());
            const emoji = parts[0] || '🏷️';
            const roleName = parts[1] || '';
            const description = parts[2] || '';
            if (roleName) results.push({ emoji, roleName, description });
        } else if (line.includes('—') || line.includes('-')) {
            const parts = line.split(/[—-]/).map(p => p.trim());
            const firstPart = parts[0];
            const description = parts[1] || '';
            const words = firstPart.split(/\s+/);
            let emoji = '🏷️';
            let roleName = firstPart;
            if (words.length > 1 && /\p{Extended_Pictographic}/u.test(words[0])) {
                emoji = words[0];
                roleName = words.slice(1).join(' ');
            }
            if (roleName) results.push({ emoji, roleName, description });
        } else {
            const words = line.split(/\s+/);
            let emoji = '🏷️';
            let roleName = line;
            if (words.length > 1 && /\p{Extended_Pictographic}/u.test(words[0])) {
                emoji = words[0];
                roleName = words.slice(1).join(' ');
            }
            if (roleName) results.push({ emoji, roleName, description: '' });
        }
    }
    return results;
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
        // 1. SLASH COMMAND: /setup-roles (Bawaan)
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
                    content: `✅ Panel Select Roles bawaan berhasil dikirim ke ${targetChannel}!`,
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
        // 2. SLASH COMMAND: /add-roles (Buka Form Modal)
        // ==========================================
        if (interaction.isChatInputCommand() && interaction.commandName === 'add-roles') {
            if (!hasStaffAccess(interaction)) {
                return interaction.reply({
                    content: '❌ Kamu tidak memiliki izin untuk menggunakan perintah ini.',
                    ephemeral: true
                });
            }

            const channelOption = interaction.options.getChannel('channel');
            const targetChannelId = channelOption ? channelOption.id : (interaction.channelId || SELECT_ROLES_CHANNEL_ID);

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
                .setLabel('Deskripsi / Petunjuk')
                .setPlaceholder('Pilih role yang paling menggambarkan keahlianmu~ 🫧')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const rolesInput = new TextInputBuilder()
                .setCustomId('input_panel_roles')
                .setLabel('Daftar Role (Emoji | Nama Role | Info)')
                .setPlaceholder('✂️ | Clipper | Membuat clip\n🎨 | Artist | Menggambar / Ilustrasi\n🎬 | Editor | Video editing')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const modeInput = new TextInputBuilder()
                .setCustomId('input_panel_mode')
                .setLabel('Pilihan (Bebas / Hanya 1)')
                .setPlaceholder('Bebas (Bisa pilih banyak) atau Hanya 1')
                .setValue('Bebas')
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

        // ==========================================
        // 3. SUBMIT FORM MODAL: modal_add_roles_*
        // ==========================================
        if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_add_roles_')) {
            const targetChannelId = interaction.customId.replace('modal_add_roles_', '');
            const targetChannel = interaction.guild.channels.cache.get(targetChannelId) || interaction.channel;

            const title = interaction.fields.getTextInputValue('input_panel_title');
            const desc = interaction.fields.getTextInputValue('input_panel_desc');
            const rolesRaw = interaction.fields.getTextInputValue('input_panel_roles');
            const modeRaw = interaction.fields.getTextInputValue('input_panel_mode') || 'Bebas';
            const colorRaw = interaction.fields.getTextInputValue('input_panel_color') || '#29b6f6';

            const isExclusive = modeRaw.toLowerCase().includes('1') || 
                                modeRaw.toLowerCase().includes('hanya') || 
                                modeRaw.toLowerCase().includes('single');

            const parsedRoles = parseRoleLines(rolesRaw);
            if (parsedRoles.length === 0) {
                return interaction.reply({
                    content: '❌ Gagal membuat panel: Daftar role tidak boleh kosong!',
                    ephemeral: true
                });
            }

            // Validasi format warna Hex
            let embedColor = '#29b6f6';
            if (/^#[0-9A-F]{6}$/i.test(colorRaw.trim())) {
                embedColor = colorRaw.trim();
            }

            // Susun teks Deskripsi Embed
            let fullDescription = desc + '\n\n';
            for (const item of parsedRoles) {
                if (item.description) {
                    fullDescription += `${item.emoji} **${item.roleName}** — ${item.description}\n`;
                } else {
                    fullDescription += `${item.emoji} **${item.roleName}**\n`;
                }
            }

            if (isExclusive) {
                fullDescription += '\n*Role ini bersifat eksklusif (hanya boleh memilih 1 role).* 🫧';
            }

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(title)
                .setDescription(fullDescription.trim());

            // Buat Tombol Interaktif (Maksimal 5 tombol per ActionRow)
            const actionRows = [];
            let currentRow = new ActionRowBuilder();
            const notFoundRoles = [];

            for (const item of parsedRoles) {
                const targetRole = findRoleByName(interaction.guild, item.roleName);
                const roleId = targetRole ? targetRole.id : item.roleName;
                const btnLabel = targetRole ? targetRole.name : item.roleName;

                if (!targetRole) {
                    notFoundRoles.push(item.roleName);
                }

                const btn = new ButtonBuilder()
                    .setCustomId(`dynrole_${roleId}_${isExclusive ? 'exclusive' : 'multi'}`)
                    .setLabel(btnLabel)
                    .setStyle(ButtonStyle.Primary);

                if (item.emoji) {
                    try {
                        btn.setEmoji(item.emoji);
                    } catch (e) {}
                }

                if (currentRow.components.length >= 5) {
                    actionRows.push(currentRow);
                    currentRow = new ActionRowBuilder();
                }
                currentRow.addComponents(btn);
            }

            if (currentRow.components.length > 0) {
                actionRows.push(currentRow);
            }

            try {
                await targetChannel.send({
                    embeds: [embed],
                    components: actionRows
                });

                let responseMsg = `✅ Panel Select Roles **${title}** berhasil dibuat dan dikirim ke ${targetChannel}!`;
                if (notFoundRoles.length > 0) {
                    responseMsg += `\n⚠️ *Catatan: Role [${notFoundRoles.join(', ')}] belum ditemukan di Server Settings, pastikan dibuat agar tombolnya bisa membagikan role.*`;
                }

                return interaction.reply({
                    content: responseMsg,
                    ephemeral: true
                });
            } catch (err) {
                console.error('❌ Error saat mengirim custom role panel:', err);
                return interaction.reply({
                    content: `❌ Gagal mengirim panel: ${err.message}`,
                    ephemeral: true
                });
            }
        }

        // ==========================================
        // 4. HANDLER BUTTON INTERACTION DINAMIS: dynrole_*
        // ==========================================
        if (interaction.isButton() && interaction.customId.startsWith('dynrole_')) {
            const parts = interaction.customId.split('_');
            const roleIdOrName = parts[1];
            const mode = parts[2] || 'multi';

            const guild = interaction.guild;
            const member = interaction.member;

            if (!member || !guild) {
                return interaction.reply({ content: '❌ Terjadi kesalahan.', ephemeral: true });
            }

            const targetRole = guild.roles.cache.get(roleIdOrName) || findRoleByName(guild, roleIdOrName);
            if (!targetRole) {
                return interaction.reply({
                    content: `❌ Role **${roleIdOrName}** belum ditemukan di server ini. Silakan hubungi Admin.`,
                    ephemeral: true
                });
            }

            const botMember = guild.members.me;
            if (botMember && targetRole.position >= botMember.roles.highest.position) {
                return interaction.reply({
                    content: `⚠️ Bot tidak memiliki izin untuk memasang role **${targetRole.name}** karena posisi role bot berada di bawah role tersebut di Server Settings. Silakan geser role Bot ke posisi lebih tinggi.`,
                    ephemeral: true
                });
            }

            try {
                const hasRole = member.roles.cache.has(targetRole.id);

                // Jika user sudah punya role -> Lepas role (Toggle OFF)
                if (hasRole) {
                    await member.roles.remove(targetRole);
                    return interaction.reply({
                        content: `🗑️ Role **${targetRole.name}** telah dihapus dari profilmu.`,
                        ephemeral: true
                    });
                }

                // Jika mode Eksklusif (Hanya boleh 1), lepas role-role lain yang ada di panel yang sama
                if (mode === 'exclusive') {
                    const messageComponents = interaction.message.components || [];
                    for (const row of messageComponents) {
                        for (const comp of row.components) {
                            if (comp.customId && comp.customId.startsWith('dynrole_')) {
                                const otherIdOrName = comp.customId.split('_')[1];
                                const otherRole = guild.roles.cache.get(otherIdOrName) || findRoleByName(guild, otherIdOrName);
                                if (otherRole && otherRole.id !== targetRole.id && member.roles.cache.has(otherRole.id)) {
                                    await member.roles.remove(otherRole).catch(() => {});
                                }
                            }
                        }
                    }
                }

                // Tambahkan role ke user (Toggle ON)
                await member.roles.add(targetRole);
                return interaction.reply({
                    content: `✅ Kamu berhasil mendapatkan role **${targetRole.name}**!`,
                    ephemeral: true
                });

            } catch (error) {
                console.error(`❌ Error dynrole:`, error);
                return interaction.reply({
                    content: `❌ Gagal mengatur role: ${error.message}`,
                    ephemeral: true
                });
            }
        }

        // ==========================================
        // 5. HANDLER BUTTON INTERACTION PRESET: role_*
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

        const targetRole = findGuildRole(guild, config);
        if (!targetRole) {
            return interaction.reply({
                content: `❌ Role **${config.name}** belum ditemukan di server ini. Pastikan nama role mengandung kata "${config.name}".`,
                ephemeral: true
            });
        }

        const botMember = guild.members.me;
        if (botMember && targetRole.position >= botMember.roles.highest.position) {
            return interaction.reply({
                content: `⚠️ Bot tidak memiliki izin untuk memasang role **${targetRole.name}** karena posisi role bot berada di bawah role tersebut di Server Settings. Silakan geser role Bot ke posisi lebih tinggi.`,
                ephemeral: true
            });
        }

        try {
            const hasRole = member.roles.cache.has(targetRole.id);

            if (hasRole) {
                await member.roles.remove(targetRole);
                return interaction.reply({
                    content: `🗑️ Role ${config.emoji} **${targetRole.name}** telah dihapus dari profilmu.`,
                    ephemeral: true
                });
            }

            if (config.opposite) {
                const oppositeConfig = ROLE_CONFIGS[config.opposite];
                if (oppositeConfig) {
                    const oppositeRole = findGuildRole(guild, oppositeConfig);
                    if (oppositeRole && member.roles.cache.has(oppositeRole.id)) {
                        await member.roles.remove(oppositeRole);
                    }
                }
            }

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
