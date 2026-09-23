/**
 * Level & XP Calculator Utility
 * Formula: XP needed for next level = 5 * (L^2) + 50 * L + 100
 * Max Level: 10
 */

const MAX_LEVEL = 10;

/**
 * Mendapatkan XP yang dibutuhkan untuk naik dari level L ke level L+1
 * @param {number} level 
 * @returns {number}
 */
function getXpForLevel(level) {
    if (level < 0) level = 0;
    return 5 * (level * level) + (50 * level) + 100;
}

/**
 * Mendapatkan total akumulasi XP yang dibutuhkan untuk mencapai level tertentu dari level 0
 * @param {number} level 
 * @returns {number}
 */
function getTotalXpForLevel(level) {
    if (level <= 0) return 0;
    const target = Math.min(level, MAX_LEVEL);
    let total = 0;
    for (let i = 0; i < target; i++) {
        total += getXpForLevel(i);
    }
    return total;
}

/**
 * Menghitung level saat ini, sisa XP pada level tersebut, dan target XP level berikutnya berdasarkan total XP
 * @param {number} totalXp 
 * @returns {{ level: number, currentXp: number, neededXp: number, progress: number, isMax: boolean }}
 */
function getLevelAndProgress(totalXp) {
    if (!totalXp || totalXp < 0) totalXp = 0;

    let level = 0;
    let remainingXp = totalXp;

    while (level < MAX_LEVEL) {
        const requiredXp = getXpForLevel(level);
        if (remainingXp >= requiredXp) {
            remainingXp -= requiredXp;
            level++;
        } else {
            break;
        }
    }

    // Jika sudah mencapai MAX LEVEL (10)
    if (level >= MAX_LEVEL) {
        const lastNeeded = getXpForLevel(MAX_LEVEL - 1);
        return {
            level: MAX_LEVEL,
            currentXp: lastNeeded,
            neededXp: lastNeeded,
            progress: 100,
            isMax: true
        };
    }

    const neededXp = getXpForLevel(level);
    const progress = Math.min(100, Math.max(0, Math.floor((remainingXp / neededXp) * 100)));

    return {
        level,
        currentXp: remainingXp,
        neededXp,
        progress,
        isMax: false
    };
}

module.exports = {
    MAX_LEVEL,
    getXpForLevel,
    getTotalXpForLevel,
    getLevelAndProgress
};
