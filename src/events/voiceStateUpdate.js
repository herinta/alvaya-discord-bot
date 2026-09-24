const { Events, ChannelType, PermissionFlagsBits } = require('discord.js');
const config = require('../config/config');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const guild = newState.guild || oldState.guild;
        const member = newState.member || oldState.member;

        // ====================================================
        // 1. AUTO CREATE VOICE CHANNEL (JOIN-TO-CREATE)
        // ====================================================
        if (newState.channelId === config.voice.autoLobbyVoice && member) {
            const categoryId = config.voice.autoCategory;
            const category = guild.channels.cache.get(categoryId);

            try {
                // Ambil semua permission setting dari Kategori agar voice channel baru 100% sinkron & private
                let permissionOverwrites = [];
                if (category && category.permissionOverwrites) {
                    permissionOverwrites = category.permissionOverwrites.cache.map(po => ({
                        id: po.id,
                        allow: po.allow.toArray(),
                        deny: po.deny.toArray(),
                        type: po.type
                    }));
                }

                // Buat nama channel sesuai nama member
                const channelName = `${member.displayName}'s Channel`;

                const newChannel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildVoice,
                    parent: categoryId,
                    permissionOverwrites: permissionOverwrites
                });

                // Pindahkan member ke channel baru yang baru saja dibuat
                await member.voice.setChannel(newChannel);
                console.log(`🔊 Auto Voice dibuat untuk ${member.displayName}: ${channelName}`);
            } catch (error) {
                console.error('❌ Gagal membuat Auto Voice channel:', error);
            }
        }

        // ====================================================
        // 2. AUTO CLEANUP (Hapus Channel jika Kosong)
        // ====================================================
        const oldChannel = oldState.channel;
        if (oldChannel) {
            const isAutoCategory = oldChannel.parentId === config.voice.autoCategory;
            const isGameCategory = oldChannel.parentId === config.voice.gameCategory;

            // Jangan hapus channel Lobby Voice utama
            const isLobby = oldChannel.id === config.voice.autoLobbyVoice || 
                            oldChannel.id === config.voice.gameLobbyVoice;

            if ((isAutoCategory || isGameCategory) && !isLobby) {
                if (oldChannel.members.size === 0) {
                    try {
                        await oldChannel.delete('Auto-delete: Voice channel sudah kosong');
                        console.log(`🗑️ Voice channel kosong dihapus: ${oldChannel.name}`);
                    } catch (error) {
                        console.error(`❌ Gagal menghapus voice channel ${oldChannel.name}:`, error.message);
                    }
                }
            }
        }
    }
};