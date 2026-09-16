const { Events } = require('discord.js');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const oldChannel = oldState.channel;

        if (oldChannel) {
            // ⚠️ SAMAKAN DENGAN ID KATEGORI DI GAME LOUNGE
            const CATEGORY_ID = '1472829010747588639'; 
            const LOBBY_VOICE_ID = '1518159971315875990'; // ✅ ID Voice Create Gaming

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