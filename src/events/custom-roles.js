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

/**
 * Parser pintar untuk membaca baris role dari form modal (Format: Emoji | Nama Role)
 */
function parseRoleLines(rawText) {
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const results = [];

    for (const line of lines) {
        if (line.includes('|')) {
            const parts = line.split('|').map(p => p.trim());
            const emoji = parts[0] || '🏷️';
            const roleName = parts[1] || '';
            if (roleName) results.push({ emoji, roleName });
        } else {
            const words = line.split(/\s+/);
            let emoji = '🏷️';
            let roleName = line;
            if (words.length > 1 && /\p{Extended_Pictographic}/u.test(words[0])) {
                emoji = words[0];
                roleName = words.slice(1).join(' ');
            }
            if (roleName) results.push({ emoji, roleName });
        }
    }
    return results;
}

/**
 * Fungsi pembantu untuk mencari role berdasarkan nama
 */
function findRoleByName(guild, rawName) {
    if (!rawName || !guild) return null;
    const clean = rawName.trim().toLowerCase();
    return guild.roles.cache.find(r => {
        const rName = r.name.toLowerCase();
        return rName === clean || rName.includes(clean) || clean.includes(rName);
    });
}

function hasStaffAccess(interaction) {
    if (!interaction.member) return false;
    if (interaction.guild?.ownerId === interaction.user.id) return true;
    if (interaction.member.permissions?.has(PermissionFlagsBits.Administrator)) return true;
    return interaction.member.roles.cache.some(role => {
        const name = role.name.toLowerCase();
        return name.includes('poseidon') || name.includes('neptune');
    });
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        
        // ==========================================
        // 1. SLASH COMMAND: /add-roles (Buka Form Modal)
        // ==========================================
        if (interaction.isChatInputCommand() && interaction.commandName === 'add-roles') {
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
                .setPlaceholder('Pilih role yang paling menggambarkan keahlianmu~ 🫧\n\n✂️ Clipper — Membuat clip\n🎨 Artist — Menggambar\n🎬 Editor — Video editing')
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
                .setLabel('Mode Pilihan (0 = Bebas, 1 = Hanya 1)')
                .setPlaceholder('0 untuk Bebas, 1 untuk Hanya 1 role')
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

        // ==========================================
        // 2. SUBMIT FORM MODAL: modal_add_roles_*
        // ==========================================
        if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_add_roles_')) {
            const targetChannelId = interaction.customId.replace('modal_add_roles_', '');
            const targetChannel = interaction.guild.channels.cache.get(targetChannelId) || interaction.channel;

            const title = interaction.fields.getTextInputValue('input_panel_title');
            const desc = interaction.fields.getTextInputValue('input_panel_desc');
            const rolesRaw = interaction.fields.getTextInputValue('input_panel_roles');
            const modeRaw = interaction.fields.getTextInputValue('input_panel_mode') || '0';
            const colorRaw = interaction.fields.getTextInputValue('input_panel_color') || '#29b6f6';

            // 1 = Eksklusif (Hanya 1 role), 0 = Bebas (Bisa banyak)
            const isExclusive = modeRaw.trim() === '1';

            const parsedRoles = parseRoleLines(rolesRaw);
            if (parsedRoles.length === 0) {
                return interaction.reply({
                    content: '❌ Gagal membuat panel: Daftar tombol role tidak boleh kosong!',
                    ephemeral: true
                });
            }

            // Validasi format warna Hex
            let embedColor = '#29b6f6';
            if (/^#[0-9A-F]{6}$/i.test(colorRaw.trim())) {
                embedColor = colorRaw.trim();
            }

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(title)
                .setDescription(desc.trim());

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
        // 3. HANDLER BUTTON INTERACTION DINAMIS: dynrole_*
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
    }
};
