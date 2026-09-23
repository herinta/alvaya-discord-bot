const { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder 
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

/**
 * Handle submit modal buat panel / edit panel roles
 */
async function handleRolePanelModal(interaction) {
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
        const targetRole = findRoleByName(interaction.guild, item.roleName);
        const roleId = targetRole ? targetRole.id : item.roleName;
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

/**
 * Handle tombol dynamic role (dynrole_*)
 */
async function handleDynRoleButton(interaction) {
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
            return await interaction.deferUpdate();
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
        return await interaction.deferUpdate();

    } catch (error) {
        console.error(`❌ Error dynrole:`, error);
        return interaction.reply({
            content: `❌ Gagal mengatur role: ${error.message}`,
            ephemeral: true
        });
    }
}

module.exports = {
    parseRoleLines,
    cleanRoleLabel,
    findRoleByName,
    handleRolePanelModal,
    handleDynRoleButton
};
