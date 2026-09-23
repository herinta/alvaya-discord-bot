const { PermissionFlagsBits } = require('discord.js');

/**
 * Memvalidasi apakah user memiliki akses staf (Owner, Admin, Role Poseidon, atau Role Neptune)
 * @param {import('discord.js').Interaction | import('discord.js').GuildMember} target 
 * @returns {boolean}
 */
function hasStaffAccess(target) {
    const member = target.member || target;
    const guild = target.guild;

    if (!member || !guild) return false;

    // Server Owner otomatis punya akses
    if (guild.ownerId === (member.id || member.user?.id)) return true;

    // Administrator
    if (member.permissions?.has(PermissionFlagsBits.Administrator)) return true;

    // Cek Role Poseidon atau Neptune (case-insensitive)
    if (member.roles?.cache) {
        return member.roles.cache.some(role => {
            const name = role.name.toLowerCase();
            return name.includes('poseidon') || name.includes('neptune');
        });
    }

    return false;
}

module.exports = {
    hasStaffAccess
};
