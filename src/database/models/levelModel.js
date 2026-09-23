const { query, isConnected } = require('../db');
const { getLevelAndProgress, getTotalXpForLevel } = require('../../utils/levelCalculator');

// Fallback in-memory map jika MySQL belum aktif/dikonfigurasi saat testing lokal
const memoryStore = new Map();

function getMemoryKey(guildId, userId) {
    return `${guildId}:${userId}`;
}

/**
 * Mengambil data level user
 * @param {string} guildId 
 * @param {string} userId 
 */
async function getUserLevel(guildId, userId) {
    if (isConnected) {
        const rows = await query(
            'SELECT * FROM user_levels WHERE guild_id = ? AND user_id = ?',
            [guildId, userId]
        );
        if (rows && rows.length > 0) {
            const data = rows[0];
            const calc = getLevelAndProgress(data.total_xp);
            return {
                guildId: data.guild_id,
                userId: data.user_id,
                level: calc.level,
                xp: calc.currentXp,
                neededXp: calc.neededXp,
                progress: calc.progress,
                totalXp: data.total_xp,
                lastXpGain: Number(data.last_xp_gain)
            };
        }
    } else {
        const key = getMemoryKey(guildId, userId);
        const data = memoryStore.get(key);
        if (data) {
            const calc = getLevelAndProgress(data.totalXp);
            return {
                guildId,
                userId,
                level: calc.level,
                xp: calc.currentXp,
                neededXp: calc.neededXp,
                progress: calc.progress,
                totalXp: data.totalXp,
                lastXpGain: data.lastXpGain
            };
        }
    }

    const initialCalc = getLevelAndProgress(0);
    return {
        guildId,
        userId,
        level: 0,
        xp: 0,
        neededXp: initialCalc.neededXp,
        progress: 0,
        totalXp: 0,
        lastXpGain: 0
    };
}

/**
 * Menambahkan XP ke user dan mengecek apakah naik level
 * @param {string} guildId 
 * @param {string} userId 
 * @param {number} xpToAdd 
 * @returns {Promise<{ leveledUp: boolean, oldLevel: number, newLevel: number, totalXp: number, currentXp: number, neededXp: number, progress: number }>}
 */
async function addXp(guildId, userId, xpToAdd) {
    const current = await getUserLevel(guildId, userId);
    const oldLevel = current.level;
    const newTotalXp = current.totalXp + xpToAdd;
    const now = Date.now();

    const newCalc = getLevelAndProgress(newTotalXp);
    const leveledUp = newCalc.level > oldLevel;

    if (isConnected) {
        await query(
            `INSERT INTO user_levels (guild_id, user_id, xp, level, total_xp, last_xp_gain)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             xp = VALUES(xp),
             level = VALUES(level),
             total_xp = VALUES(total_xp),
             last_xp_gain = VALUES(last_xp_gain)`,
            [guildId, userId, newCalc.currentXp, newCalc.level, newTotalXp, now]
        );
    } else {
        const key = getMemoryKey(guildId, userId);
        memoryStore.set(key, {
            guildId,
            userId,
            totalXp: newTotalXp,
            lastXpGain: now
        });
    }

    return {
        leveledUp,
        oldLevel,
        newLevel: newCalc.level,
        totalXp: newTotalXp,
        currentXp: newCalc.currentXp,
        neededXp: newCalc.neededXp,
        progress: newCalc.progress
    };
}

/**
 * Mengatur level user secara manual (Admin)
 * @param {string} guildId 
 * @param {string} userId 
 * @param {number} targetLevel 
 */
async function setUserLevel(guildId, userId, targetLevel) {
    const totalXp = getTotalXpForLevel(targetLevel);
    const calc = getLevelAndProgress(totalXp);
    const now = Date.now();

    if (isConnected) {
        await query(
            `INSERT INTO user_levels (guild_id, user_id, xp, level, total_xp, last_xp_gain)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             xp = VALUES(xp),
             level = VALUES(level),
             total_xp = VALUES(total_xp),
             last_xp_gain = VALUES(last_xp_gain)`,
            [guildId, userId, calc.currentXp, calc.level, totalXp, now]
        );
    } else {
        const key = getMemoryKey(guildId, userId);
        memoryStore.set(key, {
            guildId,
            userId,
            totalXp,
            lastXpGain: now
        });
    }

    return {
        level: calc.level,
        totalXp,
        currentXp: calc.currentXp,
        neededXp: calc.neededXp,
        progress: calc.progress
    };
}

/**
 * Mendapatkan posisi rank user di server (contoh: #1, #5)
 * @param {string} guildId 
 * @param {string} userId 
 * @returns {Promise<number>}
 */
async function getUserRank(guildId, userId) {
    const current = await getUserLevel(guildId, userId);
    if (!current || current.totalXp === 0) return 0;

    if (isConnected) {
        const rows = await query(
            `SELECT COUNT(*) AS \`rank\` FROM user_levels
             WHERE guild_id = ? AND total_xp > ?`,
            [guildId, current.totalXp]
        );
        return (rows && rows[0] ? Number(rows[0].rank) : 0) + 1;
    } else {
        let rank = 1;
        for (const [k, v] of memoryStore.entries()) {
            if (k.startsWith(`${guildId}:`) && v.totalXp > current.totalXp) {
                rank++;
            }
        }
        return rank;
    }
}

/**
 * Mendapatkan daftar leaderboard Top N member tertinggi di server
 * @param {string} guildId 
 * @param {number} limit 
 */
async function getLeaderboard(guildId, limit = 10) {
    if (isConnected) {
        const rows = await query(
            `SELECT user_id, level, total_xp
             FROM user_levels
             WHERE guild_id = ?
             ORDER BY total_xp DESC
             LIMIT ?`,
            [guildId, limit]
        );

        return (rows || []).map((row, idx) => {
            const calc = getLevelAndProgress(row.total_xp);
            return {
                rank: idx + 1,
                userId: row.user_id,
                level: calc.level,
                currentXp: calc.currentXp,
                neededXp: calc.neededXp,
                totalXp: row.total_xp
            };
        });
    } else {
        const list = [];
        for (const [k, v] of memoryStore.entries()) {
            if (k.startsWith(`${guildId}:`)) {
                list.push({ userId: v.userId, totalXp: v.totalXp });
            }
        }
        list.sort((a, b) => b.totalXp - a.totalXp);
        return list.slice(0, limit).map((item, idx) => {
            const calc = getLevelAndProgress(item.totalXp);
            return {
                rank: idx + 1,
                userId: item.userId,
                level: calc.level,
                currentXp: calc.currentXp,
                neededXp: calc.neededXp,
                totalXp: item.totalXp
            };
        });
    }
}

module.exports = {
    getUserLevel,
    addXp,
    setUserLevel,
    getUserRank,
    getLeaderboard
};
