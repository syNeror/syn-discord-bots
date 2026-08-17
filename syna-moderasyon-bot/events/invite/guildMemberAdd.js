// events/invite/guildMemberAdd.js
const { EmbedBuilder, Events } = require('discord.js');
const log = require('../../log.json'); // log.json içinden log kanalını al
const LOG_CHANNEL_ID = log['Stdavet-log'];

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    try {
      const guild = member.guild;

      // Log kanalı
      const logCh = guild.channels.cache.get(LOG_CHANNEL_ID);
      if (!logCh?.isTextBased()) return;

      // Guild’deki davetleri çek
      const newInvites = await guild.invites.fetch();
      const usedInvite = newInvites.find(inv => guild.invitesCache.get(inv.code)?.uses < inv.uses);
      guild.invitesCache = newInvites; // cache güncelle

      const inviter = usedInvite?.inviter;
      const inviteCode = usedInvite ? `${usedInvite.code} - ${usedInvite.uses}` : 'N/A';

      const embed = new EmbedBuilder()
        .setColor('#3b3b41')
        .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL() })
        .setDescription(`> ${member} kişisi sunucuya ${inviter ? inviter : 'Sunucu Özel URL'} (${guild.name}) daveti ile katıldı.`)
        .addFields(
          { name: '<a:1389975446560440482:1413636566185807963> **Davet Eden**', value: `\`\`\`fix\n${inviter ? inviter.tag : 'Sunucu Özel URL'}\n\`\`\``, inline: false },
          { name: '<:1249678270862069780:1408509202594398218> **Davet Edilen**', value: `\`\`\`fix\n${member.user.tag}\n\`\`\``, inline: false },
          { name: '<a:13899754405501378661:1413636586830037125> **Davet Kodu**', value: `\`\`\`fix\n${inviteCode}\n\`\`\``, inline: false },
          { name: '<a:1389975454496329728:1413636582300188862> **Zaman / Tarih**', value: `\`\`\`fix\n${new Date().toLocaleString('tr-TR')}\n\`\`\``, inline: false }
        )
        .setThumbnail(member.user.displayAvatarURL())
        .setFooter({ text: "Synatx Bot's | Davet Sistemi." });

      logCh.send({ embeds: [embed] }).catch(() => {});
    } catch (err) {
      console.error('guildMemberAdd davet log hata:', err);
    }
  }
};
