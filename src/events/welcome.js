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
                .setTitle('🌊 Welcome to Aquarium Lele! 🐟')
                .setDescription(
                    `Hii fishyyy, welcome to our little Aquarium! 🫧💙\n\n` +  
                    `• 📜 Check the rules first!\n` +
                    `• 🎀 Pick your roles!\n` +
                    `• 🪪 Introduce yourself!\n` +
                    `• 💬 Come say hi & have fun!\n\n` +
                    `Don't be shy, come swim with us~ 🐠💙`
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