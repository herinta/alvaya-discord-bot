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
 * Fungsi untuk membersihkan emoji di awal teks label agar tidak dobel
 */
function cleanRoleLabel(name) {
    if (!name) return '';
    const cleaned = name.replace(/^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\uFE0F|\s)+/u, '').trim();
    return cleaned || name;
}

/**
 * Fungsi pembantu untuk mencari role berdasarkan nama
 */
function findRoleByName(guild, rawName) {
    if (!rawName || !guild) return null;
    const clean = rawName.trim().toLowerCase();
    const cleanNoEmoji = cleanRoleLabel(clean).toLowerCase();
    return guild.roles.cache.find(r => {
        const rName = r.name.toLowerCase();
        return rName === clean || 
               rName.includes(clean) || 
               clean.includes(rName) ||
               rName.includes(cleanNoEmoji) ||
               cleanNoEmoji.includes(cleanRoleLabel(rName).toLowerCase());
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
        // 1. SLASH COMMAND: /add-roles (Buka Form Modal Baru)
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

        // ==========================================
        // 2. SLASH COMMAND: /edit-roles (Buka Form Modal Pre-filled)
        // ==========================================
        if (interaction.isChatInputCommand() && interaction.commandName === 'edit-roles') {
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

        // ==========================================
        // 3. SUBMIT FORM MODAL: modal_add_roles_* / modal_edit_roles_*
        // ==========================================
        if (interaction.isModalSubmit() && (interaction.customId.startsWith('modal_add_roles_') || interaction.customId.startsWith('modal_edit_roles_'))) {
            const isEdit = interaction.customId.startsWith('modal_edit_roles_');
            let targetChannelId = '';
            let messageIdToEdit = '';

            if (isEdit) {
                const parts = interaction.customId.replace('modal_edit_roles_', '').split('_');
                targetChannelId = parts[0];
                messageIdToEdit = parts[1];
            } else {
                targetChannelId = interaction.customId.replace('modal_add_roles_', '');
            }

            const targetChannel = interaction.guild.channels.cache.get(targetChannelId) || interaction.channel;

            const title = interaction.fields.getTextInputValue('input_panel_title');
            const desc = interaction.fields.getTextInputValue('input_panel_desc');
            const rolesRaw = interaction.fields.getTextInputValue('input_panel_roles');
            const modeRaw = interaction.fields.getTextInputValue('input_panel_mode') || '0';
            const colorRaw = interaction.fields.getTextInputValue('input_panel_color') || '#29b6f6';

            // 1 = Single-select (Hanya 1 role), 0 = Multi-select (Bisa banyak)
            const isExclusive = modeRaw.trim() === '1' || modeRaw.toLowerCase().includes('single');

            const parsedRoles = parseRoleLines(rolesRaw);
            if (parsedRoles.length === 0) {
                return interaction.reply({
                    content: '❌ Gagal: Daftar tombol role tidak boleh kosong!',
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
                const rawLabel = item.roleName || (targetRole ? targetRole.name : '');
                const btnLabel = item.emoji ? cleanRoleLabel(rawLabel) : rawLabel;

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
                if (isEdit) {
                    // Update pesan yang sudah ada
                    const targetMessage = await targetChannel.messages.fetch(messageIdToEdit);
                    await targetMessage.edit({
                        embeds: [embed],
                        components: actionRows
                    });

                    let responseMsg = `✅ Panel Select Roles **${title}** berhasil diperbarui!`;
                    if (notFoundRoles.length > 0) {
                        responseMsg += `\n⚠️ *Catatan: Role [${notFoundRoles.join(', ')}] belum ditemukan di Server Settings.*`;
                    }

                    return interaction.reply({
                        content: responseMsg,
                        ephemeral: true
                    });
                } else {
                    // Kirim pesan baru
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
                }
            } catch (err) {
                console.error('❌ Error saat memproses role panel:', err);
                return interaction.reply({
                    content: `❌ Gagal memproses panel: ${err.message}`,
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

                // Jika mode Eksklusif (Single-select), lepas role-role lain yang ada di panel yang sama
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
