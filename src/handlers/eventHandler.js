const fs = require('fs');
const path = require('path');

/**
 * Load all event files from the events directory
 * @param {import('discord.js').Client} client 
 */
function loadEvents(client) {
    const eventsPath = path.join(__dirname, '../events');

    if (!fs.existsSync(eventsPath)) {
        return;
    }

    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event?.name && typeof event.execute === 'function') {
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args));
            } else {
                client.on(event.name, (...args) => event.execute(...args));
            }
        } else {
            console.warn(`[WARNING] Event di ${filePath} tidak memiliki properti "name" atau "execute".`);
        }
    }

    console.log(`✅ Loaded ${eventFiles.length} event(s)`);
}

module.exports = {
    loadEvents
};
