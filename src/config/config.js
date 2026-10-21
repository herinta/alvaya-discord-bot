/**
 * Konfigurasi Terpusat Alvaya Bot
 * Menyimpan ID Channel, Kategori, Role, dan YouTube
 */
module.exports = {
    // Feature Toggles (Nyalakan / Matikan fitur dengan true / false)
    features: {
        leveling: true // Aktif untuk testing & penggunaan
    },

    // Role Reward Tiap Level (Level 1 - 10)
    levelRoles: {
        1: '1562456739843014696',
        2: '1562457016625274950',
        3: '1562457223991660654',
        4: '1562457558457782312',
        5: '1562457670835896470',
        6: '1562457776142422016',
        7: '1562457896174755920',
        8: '1562458044502122567',
        9: '1562458162655662080',
        10: '1562458680828493854'
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
