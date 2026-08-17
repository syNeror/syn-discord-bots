// events/invite/guildMemberRemove.js
const { EmbedBuilder, Events } = require('discord.js');
const log = require('../../log.json');
const LOG_CHANNEL_ID = log['Stdavet-log'];

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member, client) {
    try {
      const guild = member.guild;
      const logCh = guild.channels.cache.get(LOG_CHANNEL_ID);
      if (!logCh?.isTextBased()) return;

      // GuildMemberAdd sırasında kaydedilen davet bilgilerini bul
      const data = client.inviteTracker?.get(member.id);

      const inviterText = data
        ? `${data.inviterTag || 'Bilinmiyor'}`
        : `Sunucu Özel URL (${guild.name})`;

      const inviteCode = data
        ? `${data.code} - ${data.uses ?? 'N/A'}`
        : `seavrp - N/A`;

      const embed = new EmbedBuilder()
        .setColor("#5D0303") // kırmızı
        .setAuthor({
          name: member.user.username,
          iconURL: member.user.displayAvatarURL()
        })
        .setDescription(`> ${member.user} sunucudan ayrıldı!`)
        .addFields(
          {
            name: '<a:1389975446560440482:1413636566185807963> **Davet Eden**',
            value: `\`\`\`fix\n${inviterText}\n\`\`\``,
            inline: false
          },
          {
            name: '<a:13899754405501378661:1413636586830037125> **Davet Kodu**',
            value: `\`\`\`fix\n${inviteCode}\n\`\`\``,
            inline: false
          },
          {
            name: '<a:1389975454496329728:1413636582300188862> **Zaman / Tarih**',
            value: `\`\`\`fix\n${new Date().toLocaleString('tr-TR')}\n\`\`\``,
            inline: false
          }
        )
        .setFooter({
          text: `Synatx Bot's | Davet Sistemi - bugün saat ${new Date().toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
          })}`
        })
        .setThumbnail(member.user.displayAvatarURL());

      logCh.send({ embeds: [embed] }).catch(() => {});
    } catch (err) {
      console.error('guildMemberRemove davet log hata:', err);
    }
  }
};
