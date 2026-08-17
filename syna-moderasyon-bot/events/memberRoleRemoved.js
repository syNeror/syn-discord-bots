// events/memberRoleRemoved.js
// discord.js v14
const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const logs = require('../log.json'); // log.json'u import et

module.exports = {
  name: 'guildMemberUpdate',
  once: false,
  /**
   * @param {import('discord.js').GuildMember} oldMember
   * @param {import('discord.js').GuildMember} newMember
   */
  async execute(oldMember, newMember) {
    try {
      // Sadece ALINAN roller
      const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));
      if (!removedRoles.size) return;

      const guild = newMember.guild;

      // Audit Log'dan "kim aldı?" bul
      let executor = null;
      try {
        const fetched = await guild.fetchAuditLogs({
          type: AuditLogEvent.MemberRoleUpdate,
          limit: 5
        });
        const entry = [...fetched.entries.values()]
          .find(e => e.target?.id === newMember.id && Date.now() - e.createdTimestamp < 15_000);
        if (entry) executor = entry.executor;
      } catch (_) {}

      // log.json’daki kanal ID’sine göre log kanalı
      const logChannel = guild.channels.cache.get(logs["Strol-log"]);
      if (!logChannel) return;

      // Her alınan rol için tek tek logla
      for (const role of removedRoles.values()) {
        const unix = Math.floor(Date.now() / 1000);

        const embed = new EmbedBuilder()
          .setColor("#5D0303") // kırmızı
          .setAuthor({
            name: executor ? `${executor.username}` : '.bilinmeyen',
            iconURL: executor?.displayAvatarURL({ size: 128 }) ?? newMember.displayAvatarURL({ size: 128 })
          })
.setDescription(
  `> <a:1390024052524978186:1413860131065827461> <@${executor?.id}> adlı yetkili <@${newMember.id}> kullanıcısından <t:${unix}:R> zaman önce <@&${role.id}> **rolünü aldı.**`
)
          .addFields(
            {
              name: '<:1249678270862069780:1408509202594398218> Rolü Alan Kişi',
              value: `\`\`\`fix\n${executor?.tag || 'Bilinmiyor'} - ${executor?.id || '???'}\n\`\`\``,
              inline: false
            },
            {
              name: '<a:1390024052524978186:1413860131065827461> Alınan Rol',
              value: `\`\`\`fix\n${role.name} - ${role.id}\n\`\`\``,
              inline: false
            },
            {
              name: '<a:1389975454496329728:1413636582300188862> Zaman / Tarih',
              value: `\`\`\`fix\n${new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}\n\`\`\``,
              inline: false
            }
          )
          .setThumbnail(newMember.displayAvatarURL({ size: 256 }))
          .setFooter({
            text: `Synatx Bot's | Log Sistemi - bugün saat ${new Date().toLocaleTimeString('tr-TR', {
              hour: '2-digit', minute: '2-digit'
            })}`
          })
          .setTimestamp();

        await logChannel.send({ embeds: [embed] }).catch(() => {});
      }
    } catch (err) {
      console.error('memberRoleRemoved hata:', err);
    }
  }
};
