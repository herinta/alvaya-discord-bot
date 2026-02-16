const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');
const fs = require('fs');

// --- KONFIGURASI ID (GANTI DISINI YA!) ---
const CONFIG = {
    WELCOME_CHANNEL_ID: '1472873395975618590', // ID Channel tempat welcome muncul
    RULES_CHANNEL_ID: '123456789012345678',   // ID Channel rules
    VERIFY_CHANNEL_ID: '123456789012345678',  // ID Channel verify
    MOD_ROLE_ID: '123456789012345678'         // ID Role Admin/Mod
};

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        try {
            // --- STEP 1: BIKIN GAMBAR (CANVAS) ---
            const canvas = createCanvas(700, 250);
            const ctx = canvas.getContext('2d');

            const bgPath = path.join(__dirname, '../../assets/welcome.jpg');
            const bgBuffer = fs.readFileSync(bgPath); 
            const background = await loadImage(bgBuffer); // Load dari Buffer, bukan path string
            
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

            // Bikin kotak transparan hitam biar tulisan kebaca
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Tulisan "WELCOME"
            ctx.font = 'bold 60px sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('WELCOME', 280, 100); // Posisi X, Y

            // Tulisan Nama User
            ctx.font = '40px sans-serif';
            ctx.fillStyle = '#00FFFF'; // Warna Cyan
            // Biar nama panjang gak kepotong, kita singkat kalo kepanjangan
            let fontSize = 40;
            let name = member.user.username.toUpperCase();
            if (name.length > 15) name = name.substring(0, 15) + '...';
            ctx.fillText(name, 280, 160);

            // Tulisan Member Count
            ctx.font = '20px sans-serif';
            ctx.fillStyle = '#cccccc';
            ctx.fillText(`Member #${member.guild.memberCount}`, 280, 200);

            // Bikin Lingkaran Avatar
            ctx.beginPath();
            ctx.arc(125, 125, 100, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();

            // Tempel Avatar User
            const avatarURL = member.user.displayAvatarURL({ extension: 'png' });
            const avatar = await loadImage(avatarURL);
            ctx.drawImage(avatar, 25, 25, 200, 200);

            // Bungkus jadi file attachment
            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'welcome-image.png' });


            // --- STEP 2: BIKIN EMBED MESSAGE ---
            const welcomeEmbed = new EmbedBuilder()
                .setColor('#00FFFF')
                .setTitle(`Welcome to ${member.guild.name}`)
                .setDescription(
                    `Heyy <@${member.id}>, Welcome to **${member.guild.name}**!\n\n` +  
                    `• Please make sure that you read the rules in.\n` +
                    `• Pick your role in.\n` +
                    `• If you have any trouble, feel free to DM.\n` +
                    `• Hope u enjoy in this server! 😽😽😽`
                )
                .setImage('attachment://welcome-image.png') // Ini nyambung ke nama file di atas
                .setTimestamp()
                .setFooter({ text: `Member #${member.guild.memberCount}`, iconURL: member.guild.iconURL() });


            // --- STEP 3: KIRIM KE DISCORD ---
            const channel = member.guild.channels.cache.get(CONFIG.WELCOME_CHANNEL_ID);
            
            if (!channel) return console.log('❌ Channel Welcome gak ketemu! Cek ID-nya.');

            await channel.send({
                content: `Hello <@${member.id}>!`, // Mention luar (biar notif)
                embeds: [welcomeEmbed],
                files: [attachment]
            });

            console.log(`✅ Welcome card terkirim buat ${member.user.tag}`);

        } catch (error) {
            console.error('❌ Error kirim welcome:', error);
        }
    },
};