module.exports = {
    name: 'ready',
    once: true, // Karena cuma jalan sekali pas start
    execute(client) {
        console.log(`🚀 Siap meluncur! Login sebagai ${client.user.tag}`);
    },
};