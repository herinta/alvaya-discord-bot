const { Events } = require('discord.js');
const { handleConfessButton, handleConfessModal } = require('../handlers/confessHandler');
const { handleIntroButton, handleIntroModal } = require('../handlers/introHandler');
const { handleRolePanelModal, handleDynRoleButton } = require('../handlers/customRoleHandler');
const { handleGameVoiceSelect } = require('../handlers/gameVoiceHandler');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        try {
            // ==========================================
            // 1. SLASH COMMANDS
            // ==========================================
            if (interaction.isChatInputCommand()) {
                const command = interaction.client.commands.get(interaction.commandName);
                if (!command) {
                    console.error(`[ERROR] Command ${interaction.commandName} tidak ditemukan.`);
                    return;
                }
                return await command.execute(interaction);
            }

            // ==========================================
            // 2. MODAL SUBMITS
            // ==========================================
            if (interaction.isModalSubmit()) {
                // Modal Announce (/announce)
                if (interaction.customId.startsWith('modal_announce_')) {
                    const announceCmd = interaction.client.commands.get('announce');
                    if (announceCmd?.handleModal) {
                        return await announceCmd.handleModal(interaction);
                    }
                }

                // Modal Edit Message (/edit-message)
                if (interaction.customId.startsWith('modal_edit_embed_') || interaction.customId.startsWith('modal_edit_biasa_')) {
                    const editCmd = interaction.client.commands.get('edit-message');
                    if (editCmd?.handleModal) {
                        return await editCmd.handleModal(interaction);
                    }
                }

                // Modal Custom Roles (/add-roles & /edit-roles)
                if (interaction.customId.startsWith('modal_add_roles_') || interaction.customId.startsWith('modal_edit_roles_')) {
                    return await handleRolePanelModal(interaction);
                }

                // Modal Confession
                if (interaction.customId === 'modal_confess_submit') {
                    return await handleConfessModal(interaction);
                }

                // Modal Introduction
                if (interaction.customId === 'modal_intro_submit') {
                    return await handleIntroModal(interaction);
                }
            }

            // ==========================================
            // 3. BUTTON CLICKS
            // ==========================================
            if (interaction.isButton()) {
                // Button Trigger Confession
                if (interaction.customId === 'btn_confess_trigger') {
                    return await handleConfessButton(interaction);
                }

                // Button Trigger Introduction
                if (interaction.customId === 'btn_intro_trigger') {
                    return await handleIntroButton(interaction);
                }

                // Button Dynamic Roles
                if (interaction.customId.startsWith('dynrole_')) {
                    return await handleDynRoleButton(interaction);
                }
            }

            // ==========================================
            // 4. SELECT MENUS
            // ==========================================
            if (interaction.isStringSelectMenu()) {
                // Game Lounge Voice Dropdowns
                if (interaction.customId === 'pc_game_list' || interaction.customId === 'mobile_game_list') {
                    return await handleGameVoiceSelect(interaction);
                }
            }
        } catch (error) {
            console.error('❌ Error unhandled di interactionCreate:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: '❌ Terjadi kesalahan saat memproses interaksi ini!', ephemeral: true }).catch(() => {});
            } else {
                await interaction.reply({ content: '❌ Terjadi kesalahan saat memproses interaksi ini!', ephemeral: true }).catch(() => {});
            }
        }
    }
};
