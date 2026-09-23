const { SlashCommandBuilder } = require('discord.js');
const levelModel = require('../../database/models/levelModel');
const { generateRankCard } = require('../../utils/rankCard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Lihat level, progress XP, dan peringkat servermu')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Pilih user yang ingin dilihat rank-nya (Opsional, default: kamu)')
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('user') || interaction.user;

        if (targetUser.bot) {
            return interaction.editReply({
                content: '❌ Bot tidak memiliki sistem rank atau XP.'
            });
        }

        try {
            const guildId = interaction.guildId;
            const userLevel = await levelModel.getUserLevel(guildId, targetUser.id);
            const userRank = await levelModel.getUserRank(guildId, targetUser.id);

            const cardAttachment = await generateRankCard({
                user: targetUser,
                level: userLevel.level,
                currentXp: userLevel.xp,
                neededXp: userLevel.neededXp,
                progress: userLevel.progress,
                rank: userRank,
                isMax: userLevel.isMax || userLevel.level >= 10
            });

            return await interaction.editReply({
                files: [cardAttachment]
            });
        } catch (error) {
            console.error('❌ Error saat membuat kartu rank:', error);
            return await interaction.editReply({
                content: '❌ Terjadi kesalahan saat memuat kartu rank.'
            });
        }
    }
};
