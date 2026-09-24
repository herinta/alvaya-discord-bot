/**
 * Konfigurasi Terpusat Alvaya Bot
 * Menyimpan ID Channel, Kategori, Role, dan YouTube
 */
module.exports = {
    // Feature Toggles (Nyalakan / Matikan fitur dengan true / false)
    features: {
        leveling: false // Dinonaktifkan sementara (ubah ke true saat kamu siap merilis fitur leveling)
    },

    // Whitelist Server ID
    allowedGuilds: (process.env.ALLOWED_GUILD_IDS || process.env.ALLOWED_GUILD_ID || '1472819152979886133')
        .split(',')
        .map(id => id.trim())
        .filter(Boolean),

    // Channel IDs
    channels: {
        welcome: '1472873395975618590',
        confess: '1472837735470600192',
        intro: '1551998837374189599',
        rules: '1472819153839722650',
        roles: '1472826120008106138',
        generalChat: '1472828511470489633',
        youtubeLive: '1515011100746322001',
        verify: '123456789012345678'
    },

    // Voice & Category IDs
    voice: {
        gameCategory: '1472829010747588639',
        gameLobbyVoice: '1518159971315875990',
        // Auto Join-To-Create Voice
        autoCategory: '1515239391390466229',
        autoLobbyVoice: '1552513360413728898'
    },

    // YouTube Live Config
    youtube: {
        channelId: 'UCI_7kBXAB3LURoI-vNiluHg',
        apiKey: process.env.YOUTUBE_API_KEY,
        checkIntervalMs: 300000 // 5 menit
    },

    // Game Config Preset
    games: {
        'pc_valo': { name: 'Valorant', limit: 5 },
        'pc_dota': { name: 'Dota 2', limit: 5 },
        'pc_apex': { name: 'Apex Legends', limit: 3 },
        'mob_ml': { name: 'Mobile Legends', limit: 5 },
        'mob_pubg': { name: 'PUBG Mobile', limit: 4 },
        'mob_ff': { name: 'Free Fire', limit: 4 }
    }
};
