require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

// Initialize Discord Bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.content === '!ping') {
        await message.reply('Pong!');
    }
});

// Login
// Ensure DISCORD_TOKEN is set in your environment variables
const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.warn('DISCORD_TOKEN is not set. Bot will not log in.');
} else {
    client.login(token);
}

// Keep the process alive for Render Worker
console.log('Bot process started...');
