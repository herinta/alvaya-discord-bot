const { ChannelType } = require('discord.js');
const config = require('../config/config');

/**
 * Handle pemilihan dropdown game untuk dynamic temporary voice channel
 */
async function handleGameVoiceSelect(interaction) {
    if (interaction.customId !== 'pc_game_list' && interaction.customId !== 'mobile_game_list') {
        return;
    }

    const lobbyVoiceId = config.voice.gameLobbyVoice;
    const categoryId = config.voice.gameCategory;
    const selectedGame = config.games[interaction.values[0]];

    if (!selectedGame) return;

    const userVoiceChannel = interaction.member.voice.channel;

    // Cek apakah user sudah masuk ke lobby voice
    if (!userVoiceChannel || userVoiceChannel.id !== lobbyVoiceId) {
        return interaction.reply({ 
            content: `❌ Kamu harus masuk ke Voice Channel <#${lobbyVoiceId}> terlebih dahulu!`, 
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
            parent: categoryId,
            userLimit: selectedGame.limit,
        });

        // Pindahkan user ke voice channel baru
        await interaction.member.voice.setChannel(newChannel);

        // Kirim konfirmasi
        await interaction.editReply({ content: `✅ Voice channel **${channelName}** berhasil dibuat!` });

        // Refresh dropdown menu
        await interaction.message.edit({ components: interaction.message.components }).catch(console.error);

    } catch (error) {
        console.error('❌ Gagal membuat temporary voice channel:', error);
        await interaction.editReply({ content: '❌ Gagal membuat channel. Pastikan bot punya permission "Manage Channels".' });
    }
}

module.exports = {
    handleGameVoiceSelect
};
