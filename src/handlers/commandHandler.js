const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const config = require('../config/config');

/**
 * Load all slash commands from the commands directory
 * @param {import('discord.js').Client} client 
 */
function loadCommands(client) {
    client.commands = new Collection();
    const commandsPath = path.join(__dirname, '../commands');

    if (!fs.existsSync(commandsPath)) {
        return;
    }

    const commandFolders = fs.readdirSync(commandsPath);

    for (const folder of commandFolders) {
        // Jika fitur leveling dimatikan, lewati folder leveling
        if (folder === 'leveling' && !config.features?.leveling) {
            continue;
        }

        const folderPath = path.join(commandsPath, folder);
        if (fs.statSync(folderPath).isDirectory()) {
            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                // Lewati command level-admin jika leveling dinonaktifkan
                if (file === 'level-admin.js' && !config.features?.leveling) {
                    continue;
                }

                const filePath = path.join(folderPath, file);
                const command = require(filePath);
                if (command?.data && typeof command.execute === 'function') {
                    client.commands.set(command.data.name, command);
                } else {
                    console.warn(`[WARNING] Command di ${filePath} tidak memiliki properti "data" atau "execute".`);
                }
            }
        } else if (folder.endsWith('.js')) {
            const command = require(folderPath);
            if (command?.data && typeof command.execute === 'function') {
                client.commands.set(command.data.name, command);
            }
        }
    }

    console.log(`✅ Loaded ${client.commands.size} slash command(s)`);
}

module.exports = {
    loadCommands
};
