const { Events, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        try {
            // --- STEP 1: BIKIN GAMBAR (CANVAS) ---
            const canvas = createCanvas(700, 250);
            const ctx = canvas.getContext('2d');

            const bgPath = path.join(__dirname, '../../assets/welcome.jpg');
            if (fs.existsSync(bgPath)) {
                const bgBuffer = fs.readFileSync(bgPath); 
                const background = await loadImage(bgBuffer);
                ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
            } else {
                ctx.fillStyle = '#1e1f22';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // Bikin kotak transparan hitam biar tulisan kebaca
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Bikin Lingkaran Avatar
            ctx.save();
            ctx.beginPath();
            ctx.arc(125, 125, 100, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();

            // Tempel Avatar User
            const avatarURL = member.user.displayAvatarURL({ extension: 'png' });
            const avatar = await loadImage(avatarURL);
            ctx.drawImage(avatar, 25, 25, 200, 200);
            ctx.restore();

            // Bungkus jadi file attachment
            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'welcome-image.png' });

            // --- STEP 2: BIKIN EMBED MESSAGE DENGAN TAG CHANNEL ---
            const welcomeEmbed = new EmbedBuilder()
                .setColor('#00FFFF')
                .setTitle('🌊 Welcome to Aquarium Lele! 🐟')
                .setDescription(
                    `Hii fishyyy, welcome to our little Aquarium! 🫧💙\n\n` +  
                    `• 📜 Check the rules first! <#${config.channels.rules}>\n` +
                    `• 🎀 Pick your roles! <#${config.channels.roles}>\n` +
                    `• 🪪 Introduce yourself! <#${config.channels.intro}>\n` +
                    `• 💬 Come say hi & have fun! <#${config.channels.generalChat}>\n\n` +
                    `Don't be shy, come swim with us~ 🐠💙`
                )
                .setImage('attachment://welcome-image.png')
                .setTimestamp()
                .setFooter({ text: `Member #${member.guild.memberCount}`, iconURL: member.guild.iconURL() });

            // --- STEP 3: KIRIM KE DISCORD ---
            const channel = member.guild.channels.cache.get(config.channels.welcome);
            
            if (!channel) {
                console.log('❌ Channel Welcome gak ketemu! Cek ID-nya di config.js.');
                return;
            }

            await channel.send({
                content: `Hello <@${member.id}>!`,
                embeds: [welcomeEmbed],
                files: [attachment]
            });

            console.log(`✅ Welcome card terkirim buat ${member.user.tag}`);

        } catch (error) {
            console.error('❌ Error kirim welcome:', error);
        }
    },
};
