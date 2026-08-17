const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nerede')
    .setDescription('Kullanıcının ses kanalı bilgilerini gösterir')
    .addUserOption(option =>
      option
        .setName('kullanıcı')
        .setDescription('Bilgilerini görmek istediğiniz kullanıcı')
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('kullanıcı');
    const targetMember = interaction.guild.members.cache.get(targetUser.id);

    if (!targetMember) {
      return interaction.reply({ content: '<:13899754306013758771:1414619305445691473> Kullanıcı sunucuda bulunamadı!', ephemeral: true });
    }

    // Ses kanalı kontrolü
    const voiceChannel = targetMember.voice.channel;
    
    if (!voiceChannel) {
      return interaction.reply({ content: '<:13899754306013758771:1414619305445691473> Bu kullanıcı hiçbir ses kanalında değil!', ephemeral: true });
    }

    // Mikrofon ve kulaklık durumu
    const isMuted = targetMember.voice.mute;
    const isDeafened = targetMember.voice.deaf;
    const isSelfMuted = targetMember.voice.selfMute;
    const isSelfDeafened = targetMember.voice.selfDeaf;

    // Ses kanalındaki diğer kullanıcılar
    const voiceMembers = voiceChannel.members
      .filter(member => !member.user.bot)
      .map(member => `<@${member.user.id}>`)
      .join(', ');

    // Mikrofon durumu
    const micStatus = isMuted || isSelfMuted ? '<a:1389982023455740078:1414430427145310348>' : '<a:1389975451245477979:1424156248101883959>';

    // Kulaklık durumu  
    const headphoneStatus = isDeafened || isSelfDeafened ? '<a:1389983204492054630:1414430422120661112>' : '<a:1389983208371781754:1414430430861459477>';

    // Embed oluştur
    const embed = new EmbedBuilder()
      .setAuthor({
        name: targetUser.username,
        iconURL: targetUser.displayAvatarURL({ dynamic: true })
      })
       .setDescription(
         `> **<@${targetUser.id}>** Adlı Kullanıcı **<#${voiceChannel.id}>** Adlı Kanalda!\n` +
         `> **Mikrofon;** ${micStatus}\n` +
         `> **Kulaklık;** ${headphoneStatus}\n` +
         `> **Sesteki Kullanıcılar;** ${voiceMembers || 'Kimse yok'}\n\n` +
         `> [Kanala Katıl!](https://discord.com/channels/${interaction.guild.id}/${voiceChannel.id})`
       )
      .setColor('#add8e6')
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({
        text: `${config.brandFooter.split(' | ')[0]} | Bilgi Sistemi.`,
        iconURL: interaction.client.user.displayAvatarURL()
      })
      .setTimestamp();

    await interaction.reply({ 
      embeds: [embed]
    });
  }
};
