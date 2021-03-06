`use strict`;

const Discord = require('discord.js');
const { token, prefix, youtubeKey } = require('./config.json');
const ytdl = require('ytdl-core');
const Youtube = require('./src/youtube/youtube');

const yt = new Youtube(youtubeKey);
const client = new Discord.Client();
const queue = new Map();

client.once('ready', () => {
  console.log('Ready!');
});

client.once('reconnecting', () => {
  console.log('Reconnecting!');
});

client.once('disconnect', () => {
  console.log('Disconnect!');
});

client.on('message', async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const serverQueue = queue.get(message.guild.id);

  if (message.content.startsWith(`${prefix}ㅅㅋ`)) {
    yt.skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}ㅌㅌ`)) {
      yt.stop(message, serverQueue);
      return;
  } else if (message.content.startsWith(`${prefix}ㅋ`)) {
      yt.showQueue(message, serverQueue);
      return;
  } else if (message.content.startsWith(`${prefix}카운터`)) {
      // counter(message);
      return;
  } else {
      yt.execute(message, serverQueue, queue);
      return;
    }
});

client.login(token);
