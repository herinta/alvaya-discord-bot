const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { AttachmentBuilder } = require('discord.js');

/**
 * Helper untuk menggambar rounded rectangle
 */
function roundRect(ctx, x, y, width, height, radius) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
}

/**
 * Generator visual Rank Card menggunakan @napi-rs/canvas
 * @param {object} params
 * @param {import('discord.js').User} params.user
 * @param {number} params.level
 * @param {number} params.currentXp
 * @param {number} params.neededXp
 * @param {number} params.progress
 * @param {number} params.rank
 * @param {boolean} [params.isMax]
 * @returns {Promise<AttachmentBuilder>}
 */
async function generateRankCard({ user, level, currentXp, neededXp, progress, rank, isMax = false }) {
    const width = 850;
    const height = 260;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Background utama (Dark Navy with Smooth Gradient)
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0d1117');
    bgGradient.addColorStop(0.5, '#161b22');
    bgGradient.addColorStop(1, '#090d13');

    ctx.fillStyle = bgGradient;
    roundRect(ctx, 0, 0, width, height, 20);
    ctx.fill();

    // 2. Glassmorphism Card Frame
    ctx.strokeStyle = isMax ? 'rgba(255, 215, 0, 0.3)' : 'rgba(0, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    roundRect(ctx, 10, 10, width - 20, height - 20, 18);
    ctx.stroke();

    // 3. Avatar Lingkaran
    const avatarX = 130;
    const avatarY = 130;
    const avatarRadius = 80;

    // Glowing border avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius + 4, 0, Math.PI * 2);
    ctx.fillStyle = isMax ? '#ffd700' : '#00e5ff';
    ctx.shadowColor = isMax ? '#ffd700' : '#00e5ff';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.restore();

    // Avatar Image Clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    try {
        const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 256 });
        const avatarImage = await loadImage(avatarUrl);
        ctx.drawImage(avatarImage, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
    } catch (e) {
        ctx.fillStyle = '#2b2d31';
        ctx.fill();
    }
    ctx.restore();

    // 4. Informasi Text (Username, Rank, Level)
    const textStartX = 250;

    // Username
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    const cleanUsername = user.displayName || user.username;
    ctx.fillText(cleanUsername.length > 18 ? cleanUsername.substring(0, 18) + '...' : cleanUsername, textStartX, 75);

    // Tag / Username kecil
    ctx.fillStyle = '#8b949e';
    ctx.font = '20px sans-serif';
    ctx.fillText(`@${user.username}`, textStartX, 110);

    // Rank Badge
    const rankText = rank > 0 ? `#${rank}` : '#-';
    ctx.fillStyle = '#8b949e';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('RANK', 610, 75);
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(rankText, 675, 75);

    // Level Badge
    ctx.fillStyle = '#8b949e';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('LEVEL', 740, 75);
    ctx.fillStyle = isMax ? '#ffd700' : '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(isMax ? '10 👑' : `${level}`, 740, 115);

    // 5. XP Numbers Text
    ctx.textAlign = 'right';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#ffffff';
    if (isMax) {
        ctx.fillText('MAX LEVEL ', 790, 160);
        ctx.fillStyle = '#ffd700';
        ctx.fillText('🏆', 820, 160);
    } else {
        ctx.fillText(`${currentXp.toLocaleString()} `, 790, 160);
        ctx.fillStyle = '#8b949e';
        ctx.font = '16px sans-serif';
        ctx.fillText(`/ ${neededXp.toLocaleString()} XP`, 820, 160);
    }
    ctx.textAlign = 'left';

    // 6. Progress Bar
    const barX = textStartX;
    const barY = 175;
    const barWidth = 560;
    const barHeight = 24;
    const barRadius = 12;

    // Background Bar (Kosong)
    ctx.fillStyle = '#21262d';
    roundRect(ctx, barX, barY, barWidth, barHeight, barRadius);
    ctx.fill();

    // Filled Bar (Progress XP)
    const filledWidth = isMax ? barWidth : Math.max(barRadius * 2, Math.floor((barWidth * progress) / 100));
    if (progress > 0 || isMax) {
        const progressGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
        if (isMax) {
            progressGradient.addColorStop(0, '#f39c12');
            progressGradient.addColorStop(1, '#f1c40f');
            ctx.shadowColor = '#f1c40f';
        } else {
            progressGradient.addColorStop(0, '#00b4d8');
            progressGradient.addColorStop(1, '#00f5d4');
            ctx.shadowColor = '#00f5d4';
        }

        ctx.fillStyle = progressGradient;
        ctx.shadowBlur = 10;
        roundRect(ctx, barX, barY, filledWidth, barHeight, barRadius);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // 7. Persentase Progress Text di tengah Bar
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = isMax ? '#1e1f22' : '#ffffff';
    ctx.fillText(isMax ? 'MAX REACHED' : `${progress}%`, barX + barWidth / 2, barY + 17);
    ctx.textAlign = 'left';

    return new AttachmentBuilder(await canvas.encode('png'), { name: 'rank-card.png' });
}

module.exports = {
    generateRankCard
};
