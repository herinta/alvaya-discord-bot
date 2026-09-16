const { Events, ChannelType } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        
        // ====================================================
        // 1. FITUR GAME LOUNGE (SELECT MENU)
        // ====================================================
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'pc_game_list' || interaction.customId === 'mobile_game_list') {

                const LOBBY_VOICE_ID = '1518159971315875990'; // ✅ ID Voice Create Gaming
                // ⚠️ JANGAN LUPA GANTI INI DENGAN ID KATEGORINYA YA
                const CATEGORY_ID = '1472829010747588639'; 

                const gameConfig = {
                    'pc_valo': { name: 'Valorant', limit: 5 },
                    'pc_dota': { name: 'Dota 2', limit: 5 },
                    'pc_apex': { name: 'Apex Legends', limit: 3 },
                    'mob_ml': { name: 'Mobile Legends', limit: 5 },
                    'mob_pubg': { name: 'PUBG Mobile', limit: 4 },
                    'mob_ff': { name: 'Free Fire', limit: 4 }
                };

                const selectedGame = gameConfig[interaction.values[0]];

                if (selectedGame) {
                    const userVoiceChannel = interaction.member.voice.channel;
                    
                    // Cek apakah user ada di lobby voice
                    if (!userVoiceChannel || userVoiceChannel.id !== LOBBY_VOICE_ID) {
                        return interaction.reply({ 
                            content: `❌ Kamu harus masuk ke Voice Channel <#${LOBBY_VOICE_ID}> terlebih dahulu!`, 
                            ephemeral: true 
                        });
                    }

                    await interaction.deferReply({ ephemeral: true });

                    const guild = interaction.guild;
                    const existingChannels = guild.channels.cache.filter(
                        c => c.type === ChannelType.GuildVoice && c.name.startsWith(selectedGame.name)
                    );
                    
                    const nextNumber = existingChannels.size + 1;
                    const channelName = `${selectedGame.name} #${nextNumber}`;

                    try {
                        // Bikin voice channel baru
                        const newChannel = await guild.channels.create({
                            name: channelName,
                            type: ChannelType.GuildVoice,
                            parent: CATEGORY_ID,
                            userLimit: selectedGame.limit,
                        });

                        // Pindahin user
                        await interaction.member.voice.setChannel(newChannel);

                        // Kirim notifikasi sukses
                        await interaction.editReply({ content: `✅ Voice channel **${channelName}** berhasil dibuat!` });

                        // 🔴 KODE FIX: Refresh dropdown menu biar nggak nyangkut
                        await interaction.message.edit({ components: interaction.message.components }).catch(console.error);

                    } catch (error) {
                        console.error(error);
                        await interaction.editReply({ content: '❌ Gagal membuat channel. Pastikan bot punya permission "Manage Channels".' });
                    }
                }
            }
        }
    }
};