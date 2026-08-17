const { Events, EmbedBuilder } = require('discord.js');
const log = require('../log.json');

module.exports = {
  name: Events.GuildBanRemove,
  async execute(ban) {
    try {
      const logChId = log['Stban-log'];
      if (!logChId) return;

      const channel =
        ban.guild.channels.cache.get(logChId) ||
        await ban.guild.channels.fetch(logChId).catch(() => null);

      if (!channel) return;

      // Audit log'tan unban yapan
      const fetchedLogs = await ban.guild.fetchAuditLogs({ limit: 1, type: 23 });
      const logEntry = fetchedLogs.entries.first();
      const executor = logEntry?.executor;

      const embed = new EmbedBuilder()
        .setAuthor({ name: ban.guild.name, iconURL: ban.guild.iconURL({ size: 256 }) })
        .setDescription(`<:13899754320777749011:1413932765128425584> | <@${executor.id}> **tarafından bir kullanıcının yasağı başarılı bir şekilde kaldırıldı.** \n\n <:1389975434665525298:1413932211538886847> **Ceza Türü:** \`UNBAN\` \n<:13917260748992021391:1413930672187375688> **Yasaklanan: ** <@${ban.user.id}> \n<:13917260748992021391:1413930672187375688> **Yasaklanan: ** <@${ban.user.id}>\n <a:1389975454496329728:1413636582300188862> **Tarih:** ${new Date().toLocaleString('tr-TR')} (${Math.floor(Date.now()/1000)}:R)`)
        .setThumbnail(ban.guild.iconURL({ size: 256 }))
        .setColor('#acdce4')
        .setFooter({ text: "Synatx Bot's | Ceza Sistemi." });

      await channel.send({ embeds: [embed] });
    } catch (err) {
      console.error('<:13899754306013758771:1414619305445691473> Unban log gönderilemedi:', err);
    }
  }
};
