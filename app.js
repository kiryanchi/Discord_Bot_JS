`use strict`;

const Discord = require('discord.js');
const client = new Discord.Client();
const { token } = require('./config.json');

client.on('ready', () => {
  console.log(`${client.user.tag} Logged in`);
});

client.on('message', msg => {
  // 봇이라면 종료
  if (msg.author.bot) return;

  if (msg.content.startsWith)
});

client.login(token);
