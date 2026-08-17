// events/channelCreate.js
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

// Audit Log’dan kanalı oluşturanı al (15 sn penceresi)
async function fetchExecutor(guild, channelId) {
  try {
    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.ChannelCreate, limit: 5 });
    const now = Date.now();
    const entry = [...logs.entries.values()].find(
      e => e.target?.id === channelId && (now - e.createdTimestamp) < 15_000
    );
    return entry?.executor ?? null;
  } catch { return null; }
}

// Overwrite’ları satır satır “İzinler: ALLOW, Engellenenler: DENY” formatında yaz
function formatOverwrites(channel) {
  const lines = [];
  channel.permissionOverwrites?.cache?.forEach(ow => {
    const allow = ow.allow.toArray();
    const deny  = ow.deny.toArray();

    if (ow.type === 0) { // role
      const name = (ow.id === channel.guild.id)
        ? '@everyone'
        : (channel.guild.roles.cache.get(ow.id)?.name ?? `Rol ${ow.id}`);
      lines.push(
        `${name} - İzinler: ${allow.length ? allow.join(', ') : 'Yok'}, ` +
        `Engellenenler: ${deny.length ? deny.join(', ') : 'Yok'}`
      );
    } else { // member
      const tag = channel.guild.members.cache.get(ow.id)?.user?.tag ?? `Üye ${ow.id}`;
      lines.push(
        `${tag} - İzinler: ${allow.length ? allow.join(', ') : 'Yok'}, ` +
        `Engellenenler: ${deny.length ? deny.join(', ') : 'Yok'}`
      );
    }
  });
  return lines;
}

module.exports = {
  name: 'channelCreate',
  /**
   * @param {import('discord.js').GuildChannel} channel
   * @param {import('discord.js').Client} client
   */
  async execute(channel, client) {
    const logCh = channel.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!logCh?.isTextBased()) return;

    const ex = await fetchExecutor(channel.guild, channel.id);
    const permLines = formatOverwrites(channel);

    const embed = new EmbedBuilder()
      .setColor("#3498db") // yeşil
      .setAuthor({ name: ex ? ex.tag : 'Bilinmeyen', iconURL: ex?.displayAvatarURL?.() })
      // 1) Description
      .setDescription(`> ${ex ? `<@${ex.id}>` : 'Bilinmeyen'} tarafından <#${channel.id}> kanalı oluşturuldu.`)
      // 2) Field’lar (hepsi fix code block)
      .addFields(
        { name: '<a:1390024057340039271:1413894433467797645> **Kanal Adı**', value: `\`\`\`fix\n${channel.name}\n\`\`\``, inline: false },
        { name: '<a:13899754405501378661:1413636586830037125> **Kanal ID**', value: `\`\`\`fix\n${channel.id}\n\`\`\``, inline: false },
        { name: '<a:1390024057340039271:1413894433467797645> **Kanal Türü**', value: `\`\`\`fix\n${typeName(channel.type)}\n\`\`\``, inline: false },
        { name: '<a:1389975446560440482:1413636566185807963> **Oluşturan**', value: `\`\`\`fix\n${ex ? `${ex.tag} - ${ex.id}` : 'Bilinmiyor'}\n\`\`\``, inline: false },
        {
          name: '<a:1389975448816979968:1413894436357931100> **İzinler**',
          value: `\`\`\`fix\n${permLines.length ? permLines.join('\n') : '@everyone - İzinler: Yok, Engellenenler: Yok'}\n\`\`\``,
          inline: false
        },
        { name: '<a:1389975454496329728:1413636582300188862> **Zaman / Tarih**', value: `\`\`\`fix\n${trDate()}\n\`\`\``, inline: false },
      )
      .setFooter({ text: "Synatx Bot's | Log Sistemi." })
      .setThumbnail(ex?.displayAvatarURL?.() || client.user.displayAvatarURL());

    logCh.send({ embeds: [embed] }).catch(() => {});
  }
};
