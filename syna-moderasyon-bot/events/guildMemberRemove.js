// events/guildMemberRemove.js
const { Events, EmbedBuilder } = require('discord.js');
const log = require('../log.json');

// Rakamları emojiye çevir
const numberEmojis = {
  '0': '<:0_:1413907321771261992>',
  '1': '<:1_:1413907347600048218>',
  '2': '<:2_:1413907306407792730>',
  '3': '<:3_:1413907324707406004>',
  '4': '<:4_:1413907303740084264>',
  '5': '<:5_:1413907311445151807>',
  '6': '<:6_:1413907313324064988>',
  '7': '<:7_:1413907349697069118>',
  '8': '<:8_:1413907316310544596>',
  '9': '<:9_:1413907319594418196>'
};
function numberToEmoji(num) {
  return String(num).split('').map(d => numberEmojis[d] || d).join('');
}

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    try {
      const logChId = log['Stcikis-log']; // log.json'daki çıkış log kanalı
      const logCh =
        member.guild.channels.cache.get(logChId) ||
        await member.guild.channels.fetch(logChId).catch(() => null);

      if (!logCh) return console.warn('⚠️ Stmember-log bulunamadı.');

      // Sunucudaki kişi sayısı (çıkış sonrası)
      const memberCountEmoji = numberToEmoji(member.guild.memberCount);

      // Hesap açılma tarihi
      const createdUnix = Math.floor(member.user.createdTimestamp / 1000);

      // Çıkış zamanı
      const nowUnix = Math.floor(Date.now() / 1000);

      // Kullanıcının rolleri
      const roles = member.roles.cache
        .filter(r => r.id !== member.guild.id)
        .map(r => r.toString())
        .join('\n') || 'Yok';

      const embed = new EmbedBuilder()
        .setColor('#5D0303')
        .setAuthor({
          name: member.user.tag,
          iconURL: member.displayAvatarURL({ size: 256 })
        })
        .setDescription(
          `> <:1249678347353718845:1413911438413533244> <@${member.id}> kişisi <t:${createdUnix}:R> açılmış hesabıyla ` +
          `> <t:${nowUnix}:R> sunucudan çıkış yaptı! Sunucumuz artık ${memberCountEmoji} kişi!`
        )
        .addFields(
          {
            name: '<:1249678270862069780:1408509202594398218> **Kullanıcı ID**',
            value: `\`\`\`fix\n${member.id}\n\`\`\``,
            inline: false
          },
          {
            name: '<a:1389975454496329728:1413636582300188862> **Sunucudan Çıkış Tarihi**',
            value: `\`\`\`fix\n${trDate()}\n\`\`\``,
            inline: false
          },
          {
            name: '<a:1390024052524978186:1413860131065827461> **Kişinin Rolleri**',
            value: roles,
            inline: false
          }
        )
        .setThumbnail(member.displayAvatarURL({ size: 256 }))
        .setFooter({ text: "Synatx Bot's | Log Sistemi." });

      await logCh.send({ embeds: [embed] });
    } catch (err) {
      console.error('guildMemberRemove hata:', err);
    }
  }
};
