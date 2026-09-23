const { Events, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Abaikan pesan yang dikirim oleh bot lain biar tidak terjadi looping
        if (message.author.bot) return;

        // ====================================================
        // 1. COMMAND: !ping
        // ====================================================
        if (message.content === '!ping') {
            message.reply('pong 🏓');
        }

        // ====================================================
        // 2. COMMAND: !testwelcome (Untuk testing UI/UX Client)
        // ====================================================
        if (message.content === '!testwelcome') {
            // Memicu event GuildMemberAdd seolah-olah user yang mengetik command baru saja masuk server
            message.client.emit(Events.GuildMemberAdd, message.member);
            
            // Memberikan reaction centang di pesan !testwelcome
            message.react('✅').catch(console.error);
        }

        // ====================================================
        // 3. COMMAND: !setupvoice (Hanya untuk Admin Server)
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

            // Mengirim embed dan menu dropdown ke channel
            await message.channel.send({ embeds: [embed], components: [pcMenu, mobileMenu] });
            
            // Menghapus pesan command '!setupvoice' agar channel tetap rapi
            message.delete().catch(console.error); 
        }
    }
};