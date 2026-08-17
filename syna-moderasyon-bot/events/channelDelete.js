// events/channelDelete.js
// discord.js v14
const { EmbedBuilder, AuditLogEvent, ChannelType } = require('discord.js');
const log = require('../log.json'); // log.json'u import et
const LOG_CHANNEL_ID = log["Stchannel-log"];

const trDate = (d = new Date()) =>
  new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeStyle: 'short' }).format(d);

const typeName = (t) => ({
  [ChannelType.GuildText]: 'Metin Kanalı',
  [ChannelType.GuildVoice]: 'Ses Kanalı',
  [ChannelType.GuildAnnouncement]: 'Duyuru Kanalı',
  [ChannelType.GuildStageVoice]: 'Sahne Kanalı',
  [ChannelType.GuildForum]: 'Forum',
  [ChannelType.GuildCategory]: 'Kategori',
  [ChannelType.GuildMedia]: 'Medya Kanalı',
}[t] ?? String(t));

// Audit Log: sileni bul (15 sn penceresi)
async function fetchExecutor(guild, channelId) {
  try {
    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 5 });
    const now = Date.now();
    const entry = [...logs.entries.values()].find(
      e => e.target?.id === channelId && (now - e.createdTimestamp) < 15_000
    );
    return entry?.executor ?? null;
  } catch {
    return null;
  }
}

module.exports = {
  name: 'channelDelete',
  /**
   * @param {import('discord.js').GuildChannel} channel
   * @param {import('discord.js').Client} client
   */
  async execute(channel, client) {
    const logCh = channel.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!logCh?.isTextBased()) return;

    const ex = await fetchExecutor(channel.guild, channel.id);

    const embed = new EmbedBuilder()
      .setColor("#5D0303") // kırmızı
      .setAuthor({ name: ex ? ex.tag : 'Bilinmeyen', iconURL: ex?.displayAvatarURL?.() })
      // İlk satır sadece description (ör: @Sea V Autorazer tarafından ┇11┇mortex3ber kanalı silindi.)
      .setDescription(`> ${ex ? `<@${ex.id}>` : 'Bilinmeyen'} tarafından **${channel.name}** kanalı silindi.`)
      // Devamı fields — içerikler fix code block
      .addFields(
        { name: '<a:1390024057340039271:1413894433467797645> **Kanal Adı**', value: `\`\`\`fix\n${channel.name}\n\`\`\``, inline: false },
        { name: '<a:13899754405501378661:1413636586830037125> **Kanal ID**', value: `\`\`\`fix\n${channel.id}\n\`\`\``, inline: false },
        { name: '<a:1390024057340039271:1413894433467797645> **Kanal Türü**', value: `\`\`\`fix\n${typeName(channel.type)}\n\`\`\``, inline: false },
        { name: '<a:1389975446560440482:1413636566185807963> **Silen**', value: `\`\`\`fix\n${ex ? `${ex.tag} - ${ex.id}` : 'Bilinmiyor'}\n\`\`\``, inline: false },
        { name: '<a:1389975454496329728:1413636582300188862> **Zaman / Tarih**', value: `\`\`\`fix\n${trDate()}\n\`\`\``, inline: false },
      )
      .setFooter({ text: "Synatx Bot's | Log Sistemi." })
      .setThumbnail(ex?.displayAvatarURL?.() || client.user.displayAvatarURL());

    logCh.send({ embeds: [embed] }).catch(() => {});
  }
};
