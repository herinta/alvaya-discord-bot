const { Events, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config');
const { createRulesEmbed, createConfessButton } = require('../handlers/confessHandler');
const { createIntroPanelEmbed, createIntroButton } = require('../handlers/introHandler');
const { handleChatMessage, syncLevelRole } = require('../handlers/levelingHandler');
const { handleKerangChat } = require('../handlers/kerangHandler');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Abaikan pesan yang dikirim oleh bot lain biar tidak terjadi looping
        if (message.author.bot) return;

        // ====================================================
        // 1. PROSES XP CHAT LEVELING (Hanya jika fitur aktif)
        // ====================================================
        if (config.features?.leveling) {
            await handleChatMessage(message);
        }

        // ====================================================
        // 1b. KERANG AJAIB AI (Jika bot di-tag/mention)
        // ====================================================
        const isMentioned = message.mentions.has(message.client.user) && !message.mentions.everyone;
        if (isMentioned) {
            await handleKerangChat(message);
            return;
        }

        // ====================================================
        // 2. COMMAND: !ping
        // ====================================================
        if (message.content === '!ping') {
            return message.reply('pong 🏓');
        }

        // ====================================================
        // 3. COMMAND: !testwelcome (Untuk testing UI/UX Client)
        // ====================================================
        if (message.content === '!testwelcome') {
            message.client.emit(Events.GuildMemberAdd, message.member);
            return message.react('✅').catch(console.error);
        }

        // ====================================================
        // 3b. COMMAND: !testlevelup (Untuk testing Notifikasi Level Up)
        // ====================================================
        if (message.content.startsWith('!testlevelup')) {
            const args = message.content.trim().split(/\s+/);
            const testLevel = args[1] ? parseInt(args[1], 10) || 1 : 1;
            const isMax = testLevel >= 10;
            await syncLevelRole(message.member, testLevel);
            
            const levelUpEmbed = new EmbedBuilder()
                .setColor('#58B9FF')
                .setTitle(isMax ? '👑🫧 PENGUASA AQUARIUM! — MAX LEVEL REACHED! 🐟' : '🌊🫧 SPLASH! LEVEL UP! 🐟')
                .setDescription(
                    `«𓆝 𓆟 𓆞 𓆝 𓆟\n` +
                    `Waaah selamat <@${message.author.id}>! Kamu berhasil berenang makin jauh dan mencapai **Level ${testLevel}**${isMax ? ' 👑' : ''}! 🫧💙\n` +
                    `»`
                )
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `Aquarium Teles • Demo Notifikasi 🫧` })
                .setTimestamp();

            return message.channel.send({
                content: `🫧 Splash! Yeay naik level nih~ <@${message.author.id}> 𓆝 𓆟 💙`,
                embeds: [levelUpEmbed]
            });
        }

        // ====================================================
        // 4. COMMAND: !setupvoice (Hanya untuk Admin Server)
        // ====================================================
        if (message.content === '!setupvoice' && message.member?.permissions.has('Administrator')) {
            const embed = new EmbedBuilder()
                .setTitle('Game Lounge')
                .setDescription('Menu ini digunakan untuk membuat Gaming Lounge.\n\n**Cara Menggunakannya:**\nSilahkan masuk ke 🔊 ➕ **Create Gaming** lalu pilih game melalui menu dibawah ini sesuai yang anda inginkan.\n\nJika ada masalah dengan Gaming Lounge. Silahkan hubungi **STAFF** yang tersedia.')
                .setColor('#2F3136');

            const pcMenu = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('pc_game_list')
                    .setPlaceholder('PC Game List')
                    .addOptions([
                        { label: 'Valorant', description: 'Maksimal 5 Orang', value: 'pc_valo' },
                        { label: 'Dota 2', description: 'Maksimal 5 Orang', value: 'pc_dota' },
                        { label: 'Apex Legends', description: 'Maksimal 3 Orang', value: 'pc_apex' }
                    ])
            );

            const mobileMenu = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('mobile_game_list')
                    .setPlaceholder('Mobile Game List')
                    .addOptions([
                        { label: 'Mobile Legends', description: 'Maksimal 5 Orang', value: 'mob_ml' },
                        { label: 'PUBG Mobile', description: 'Maksimal 4 Orang', value: 'mob_pubg' },
                        { label: 'Free Fire', description: 'Maksimal 4 Orang', value: 'mob_ff' }
                    ])
            );

            await message.channel.send({ embeds: [embed], components: [pcMenu, mobileMenu] });
            return message.delete().catch(console.error); 
        }

        // ====================================================
        // 5. COMMAND: !setupconfess
        // ====================================================
        if (message.content === '!setupconfess') {
            await message.delete().catch(() => {});
            return message.channel.send({
                embeds: [createRulesEmbed()],
                components: [createConfessButton()]
            });
        }

        // ====================================================
        // 6. COMMAND: !setupintro (Setup Panel Introduction)
        // ====================================================
        if (message.content === '!setupintro') {
            await message.delete().catch(() => {});
            return message.channel.send({
                embeds: [createIntroPanelEmbed()],
                components: [createIntroButton()]
            });
        }
    }
};