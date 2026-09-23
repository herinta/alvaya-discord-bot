const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { hasStaffAccess } = require('../../utils/permissions');
const levelModel = require('../../database/models/levelModel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level-admin')
        .setDescription('Perintah khusus admin untuk mengelola level dan XP member')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add-xp')
                .setDescription('Tambahkan sejumlah XP ke pengguna')
                .addUserOption(opt => opt.setName('user').setDescription('Pilih pengguna').setRequired(true))
                .addIntegerOption(opt => opt.setName('amount').setDescription('Jumlah XP').setRequired(true).setMinValue(1))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-level')
                .setDescription('Atur level pengguna secara langsung (Maks Level 10)')
                .addUserOption(opt => opt.setName('user').setDescription('Pilih pengguna').setRequired(true))
                .addIntegerOption(opt => opt.setName('level').setDescription('Target Level (0 - 10)').setRequired(true).setMinValue(0).setMaxValue(10))
        ),

    async execute(interaction) {
        if (!hasStaffAccess(interaction)) {
            return interaction.reply({
                content: '❌ Kamu tidak memiliki izin untuk menggunakan perintah admin leveling ini.',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('user');
        const guildId = interaction.guildId;

        if (targetUser.bot) {
            return interaction.reply({
                content: '❌ Tidak dapat mengubah XP atau Level bot.',
                ephemeral: true
            });
        }

        if (subcommand === 'add-xp') {
            const amount = interaction.options.getInteger('amount');
            const result = await levelModel.addXp(guildId, targetUser.id, amount);
            
            return interaction.reply({
                content: `✅ Berhasil menambahkan **${amount.toLocaleString()} XP** ke <@${targetUser.id}>!\nSekarang Level: **${result.newLevel}** (Total XP: ${result.totalXp.toLocaleString()})`,
                ephemeral: true
            });
        }

        if (subcommand === 'set-level') {
            const targetLevel = interaction.options.getInteger('level');
            const result = await levelModel.setUserLevel(guildId, targetUser.id, targetLevel);

            return interaction.reply({
                content: `✅ Berhasil mengubah level <@${targetUser.id}> menjadi **Level ${result.level}** (Total XP disesuaikan: ${result.totalXp.toLocaleString()})`,
                ephemeral: true
            });
        }
    }
};
