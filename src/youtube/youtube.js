const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const axios = require('axios');

class Youtube {
  constructor(api) {
    this.API = api;
  }

  async execute(message, serverQueue, queue) {
    const SONG_TITLE = message.content.slice(4);

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
      return message.channel.send(
        'You need to be in a voice channel to play music!'
      );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
      return message.channel.send(
        'I need the permissions to join and speak in your voice channel!'
      );
    }

    const songList = await this._search(SONG_TITLE);
    let songListText = '```css\n';
    for (let n in songList) {
      n++;
      songListText += `${n}: ${songList[n - 1].title}\n`;
    }
    songListText += 'c or ㅊ : 취소\n```';

    const tempSongListMessage = await message.channel.send(songListText);
    const answers = [
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      'c',
      'ㅊ',
    ];
    const filter = response => {
      return response.author.id === message.author.id && response in answers;
    };

    try {
      var collected = await message.channel.awaitMessages(filter, {
        max: 1,
        time: 10000,
        errors: ['time'],
      });
    } catch {
      tempSongListMessage.delete();
      message.channel.send('시간이 초과되었습니다.');
      return;
    }

    let select = collected.first().content;
    if (select === 'c' || select === 'ㅊ') {
      collected.delete();
      message.channel.send('취소가선택됨');
      tempSongListMessage.delete();
      return;
    }
    select = parseInt(select) - 1;
    const song = songList[select];
    message.channel.send(`${song.title} 선택됨`);
    collected.delete();
    tempSongListMessage.delete();

    if (!serverQueue) {
      const queueContruct = {
        textChannel: message.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 5,
        playing: true,
      };

      queue.set(message.guild.id, queueContruct);

      queueContruct.songs.push(song);

      try {
        var connection = await voiceChannel.join();
        queueContruct.connection = connection;
        this._play(message.guild, queueContruct.songs[0], queue);
      } catch (err) {
        console.log(err);
        queue.delete(message.guild.id);
        return message.channel.send(err);
      }
    } else {
      serverQueue.songs.push(song);
      return message.channel.send(`${song.title} 가 추가되었습니다.`);
    }
  }

  skip(message, serverQueue) {
    if (!message.member.voice.channel)
      return message.channel.send('음성 채널에 있어야 스킵가능!');
    if (!serverQueue) return message.channel.send('스킵할 곡이 없슴다');
    serverQueue.connection.dispatcher.end();
  }

  stop(message, serverQueue) {
    if (!message.member.voice.channel)
      return message.channel.send('음성 채널에 있어야 스탑가능!');
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
  }

  showQueue(message, serverQueue) {
    if (!serverQueue || !serverQueue.songs) {
      message.channel.send('큐가 비어있습니다.');
      return;
    }
    let text = '```css\n';

    for (let i in serverQueue.songs) {
      i++;
      text += `${i}: ${serverQueue.songs[i-1].title}\n`;
    }
    text += '```';

    message.channel.send(text);
  }

  async _search(songTitle) {
    let url = 'https://www.googleapis.com/youtube/v3/search?';
    const optionParams = {
      q: encodeURI(songTitle),
      part: 'snippet',
      key: this.API,
      maxResults: 15,
      regionCode: 'KR',
    };

    for (let option in optionParams) {
      url += option + '=' + optionParams[option] + '&';
    }

    // Remove last '&'
    url = url.substr(0, url.length - 1);

    const response = await axios.get(url);
    const dataFromYoutube = response.data.items;

    const list = [];
    for (let n in dataFromYoutube) {
      const songObj = {
        title: dataFromYoutube[n].snippet.title,
        url: 'https://youtu.be/' + dataFromYoutube[n].id.videoId,
      };
      list.push(songObj);
    }

    return list;
  }

  _play(guild, song, queue) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
      serverQueue.voiceChannel.leave();
      queue.delete(guild.id);
      return;
    }

    const dispatcher = serverQueue.connection
      .play(ytdl(song.url, { filter: 'audioonly', type: 'opus', highWaterMark: 1<<25 }))
      .on('finish', () => {
        console.log('노래끝');
        serverQueue.songs.shift();
        this._play(guild, serverQueue.songs[0], queue);
      })
      .on('error', error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`**${song.title}** 노래 재생`);
  }
}

module.exports = Youtube;
