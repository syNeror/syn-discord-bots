// events/memberRoleAdded.js
const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const logs = require('../log.json'); // log.json’dan oku

module.exports = {
  name: 'guildMemberUpdate',
  once: false,
  async execute(oldMember, newMember) {
    try {
      const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
      if (!addedRoles.size) return;

      const guild = newMember.guild;

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

      // log.json’daki Strol-log alanına bağlı kanal
      const logChannel = guild.channels.cache.get(logs["Strol-log"]);
      if (!logChannel) return;

      for (const role of addedRoles.values()) {
        const unix = Math.floor(Date.now() / 1000);

        const embed = new EmbedBuilder()
          .setColor('#046404')
          .setAuthor({
            name: executor ? `${executor.username}` : '.bilinmeyen',
            iconURL: executor?.displayAvatarURL({ size: 128 }) ?? newMember.displayAvatarURL({ size: 128 })
          })
          .setDescription(
            `> <a:1390024052524978186:1413860131065827461> ${executor ? `<@${executor.id}>` : 'Bilinmeyen yetkili'} ` +
            `<@${newMember.id}> kullanıcısına <t:${unix}:R> zaman önce <@&${role.id}> **rolünü verdi.**`
          )
          .addFields(
            {
              name: '<:1249678270862069780:1408509202594398218> Rolü Veren Kişi',
              value: `\`\`\`fix\n${executor ? `${executor.tag} - ${executor.id}` : 'Bilinmiyor - ???'}\n\`\`\``
            },
            {
              name: '<a:1390024052524978186:1413860131065827461> Verilen Rol',
              value: `\`\`\`fix\n${role.name} - ${role.id}\n\`\`\``
            },
            {
              name: '<a:1389975454496329728:1413636582300188862> Zaman / Tarih',
              value: `\`\`\`fix\n${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}\n\`\`\``
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
      console.error('memberRoleAdded hata:', err);
    }
  }
};
