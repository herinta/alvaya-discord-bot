const { Events } = require('discord.js');
const config = require('../config/config');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const oldChannel = oldState.channel;

        if (oldChannel) {
            const CATEGORY_ID = config.voice.gameCategory; 
            const LOBBY_VOICE_ID = config.voice.gameLobbyVoice;

            if (oldChannel.parentId === CATEGORY_ID) {
                if (oldChannel.id === LOBBY_VOICE_ID) return;

                if (oldChannel.members.size === 0) {
                    try {
                        await oldChannel.delete('Auto-delete: Voice Lounge sudah kosong');
                    } catch (error) {
                        console.error(`❌ Gagal menghapus channel ${oldChannel.name}:`, error);
                    }
                }
            }
        }
    }
};