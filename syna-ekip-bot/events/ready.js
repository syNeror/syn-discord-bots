const { Events, ChannelType } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const config = require('../config.json');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Bot hazır! ${client.user.tag} olarak giriş yapıldı.`);
        console.log(`${client.guilds.cache.size} sunucuda aktif`);
        console.log(`${client.users.cache.size} kullanıcıya hizmet veriyor`);
        
        // Bot durumunu "Rahatsız Etmeyin" olarak ayarla
        client.user.setPresence({
            status: 'dnd', // Do Not Disturb / Rahatsız Etmeyin
            activities: [{
                name: 'discord.gg/legante',
                type: 0 // PLAYING
            }]
        });

        // Ses kanalına bağlan
        try {
            const guild = client.guilds.cache.get(config.guildId);
            if (!guild) {
                console.error('❌ Guild bulunamadı!');
                return;
            }

            const voiceChannel = guild.channels.cache.get(config.voiceChannelId);
            if (!voiceChannel) {
                console.error('❌ Ses kanalı bulunamadı!');
                return;
            }

            if (voiceChannel.type !== ChannelType.GuildVoice) {
                console.error('❌ Belirtilen kanal bir ses kanalı değil!');
                return;
            }

            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
            });

            console.log(`✅ Ses kanalına bağlanıldı: ${voiceChannel.name} (${voiceChannel.id})`);

            // Bağlantı hatalarını dinle
            connection.on('error', error => {
                console.error('❌ Ses kanalı bağlantı hatası:', error);
            });

            connection.on('stateChange', (oldState, newState) => {
                console.log(`🔄 Ses bağlantı durumu: ${oldState.status} -> ${newState.status}`);
            });

        } catch (error) {
            console.error('❌ Ses kanalına bağlanırken hata:', error);
        }
    },
};
