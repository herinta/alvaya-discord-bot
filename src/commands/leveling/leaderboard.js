const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const levelModel = require('../../database/models/levelModel');

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Lihat daftar 10 member dengan level tertinggi di server ini'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const guildId = interaction.guildId;
            const topUsers = await levelModel.getLeaderboard(guildId, 10);

            if (!topUsers || topUsers.length === 0) {
                return interaction.editReply({
                    content: '📊 Belum ada data keaktifan chat di server ini. Mulailah mengobrol di channel chat!'
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#00FFFF')
                .setTitle(`🏆 Peringkat Keaktifan Server - ${interaction.guild.name}`)
                .setDescription('Daftar member paling aktif berdasarkan perolehan Level & XP:')
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setFooter({ text: 'Alvaya Leveling System • Terus aktif untuk naik peringkat!' })
                .setTimestamp();

            const lines = topUsers.map((item, index) => {
                const medal = MEDALS[index] || `#${index + 1}`;
                return `${medal} **<@${item.userId}>** — **Level ${item.level}** (${item.totalXp.toLocaleString()} Total XP)`;
            });

            embed.addFields({
                name: 'Top 10 Member',
                value: lines.join('\n')
            });

            return await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('❌ Error saat memuat leaderboard:', error);
            return await interaction.editReply({
                content: '❌ Gagal memuat papan peringkat server.'
            });
        }
    }
};
