// events/channelUpdate.js
// discord.js v14
const { EmbedBuilder, AuditLogEvent, ChannelType, PermissionFlagsBits } = require('discord.js');
const log = require('../log.json');
const LOG_CHANNEL_ID = log["Stchannel-log"];

const trDate = (d = new Date()) =>
  new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeStyle: 'short' }).format(d);

const typeName = (t) => ({
  [ChannelType.GuildText]: 'Yazı',
  [ChannelType.GuildVoice]: 'Ses',
  [ChannelType.GuildAnnouncement]: 'Duyuru',
  [ChannelType.GuildStageVoice]: 'Sahne',
  [ChannelType.GuildForum]: 'Forum',
  [ChannelType.GuildCategory]: 'Kategori',
  [ChannelType.GuildMedia]: 'Medya',
}[t] ?? String(t));

// Audit Log: ChannelUpdate yapan kişiyi bul (15 sn)
async function fetchExecutor(guild, channelId) {
  try {
    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.ChannelUpdate, limit: 5 });
    const now = Date.now();
    const entry = [...logs.entries.values()].find(
      e => e.target?.id === channelId && (now - e.createdTimestamp) < 15_000
    );
    return entry?.executor ?? null;
  } catch {
    return null;
  }
}

// Permission overwrite diff
function overwritesMap(ch) {
  const m = {};
  ch.permissionOverwrites?.cache?.forEach(ow => {
    m[ow.id] = {
      allow: ow.allow.bitfield.toString(),
      deny: ow.deny.bitfield.toString(),
      type: ow.type // 0=role, 1=member
    };
  });
  return m;
}
function diffOverwrites(oldCh, newCh) {
  const oldM = overwritesMap(oldCh);
  const newM = overwritesMap(newCh);
  const ids = new Set([...Object.keys(oldM), ...Object.keys(newM)]);
  const lines = [];

  for (const id of ids) {
    const a = oldM[id], b = newM[id];
    if (!a && b) lines.push(`+ overwrite: ${b.type === 0 ? 'rol' : 'üye'} ${id}`);
    else if (a && !b) lines.push(`- overwrite: ${a.type === 0 ? 'rol' : 'üye'} ${id}`);
    else if (a && b && (a.allow !== b.allow || a.deny !== b.deny))
      lines.push(`~ overwrite: ${b.type === 0 ? 'rol' : 'üye'} ${id}`);
  }
  return lines;
}

// Anlamlı kanal değişikliklerini topla (sadece pozisyonu es geç)
function collectChannelChanges(oldC, newC) {
  const changes = [];

  if (oldC.name !== newC.name)
    changes.push(`name:  ${oldC.name} -> ${newC.name}`);

  if (oldC.type !== newC.type)
    changes.push(`type:  ${typeName(oldC.type)} -> ${typeName(newC.type)}`);

  if (oldC.parentId !== newC.parentId)
    changes.push(`parent:  ${oldC.parent?.name ?? 'Yok'} -> ${newC.parent?.name ?? 'Yok'}`);

  if (('topic' in oldC || 'topic' in newC) && oldC.topic !== newC.topic)
    changes.push(`topic:  ${(oldC.topic ?? '—')} -> ${(newC.topic ?? '—')}`);

  if (('nsfw' in oldC || 'nsfw' in newC) && oldC.nsfw !== newC.nsfw)
    changes.push(`nsfw:  ${oldC.nsfw ? 'Açık' : 'Kapalı'} -> ${newC.nsfw ? 'Açık' : 'Kapalı'}`);

  if (('rateLimitPerUser' in oldC || 'rateLimitPerUser' in newC) &&
      (oldC.rateLimitPerUser ?? 0) !== (newC.rateLimitPerUser ?? 0))
    changes.push(`slowmode:  ${oldC.rateLimitPerUser ?? 0}s -> ${newC.rateLimitPerUser ?? 0}s`);

  if (('bitrate' in oldC || 'bitrate' in newC) &&
      (oldC.bitrate ?? 0) !== (newC.bitrate ?? 0))
    changes.push(`bitrate:  ${oldC.bitrate ?? 0} -> ${newC.bitrate ?? 0}`);

  if (('userLimit' in oldC || 'userLimit' in newC) &&
      (oldC.userLimit ?? 0) !== (newC.userLimit ?? 0))
    changes.push(`userLimit:  ${oldC.userLimit ?? 0} -> ${newC.userLimit ?? 0}`);

  // Sadece pozisyon değiştiyse boş döner (görseldeki metni yine atacağız)
  return changes;
}

module.exports = {
  name: 'channelUpdate',
  /**
   * @param {import('discord.js').GuildChannel} oldChannel
   * @param {import('discord.js').GuildChannel} newChannel
   * @param {import('discord.js').Client} client
   */
  async execute(oldChannel, newChannel, client) {
    const logCh = newChannel.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!logCh?.isTextBased()) return;

    const ex = await fetchExecutor(newChannel.guild, newChannel.id);
    const changes = collectChannelChanges(oldChannel, newChannel);
    const owLines = diffOverwrites(oldChannel, newChannel);

    const embed = new EmbedBuilder()
      .setColor("#fee65c") // sarı ton, görseldeki gibi
      .setAuthor({ name: ex ? ex.tag : 'Bilinmeyen', iconURL: ex?.displayAvatarURL?.() })
      // İlk satır: description (örn: @Macro tarafından #silah-ruhsat kanalı düzenlendi.)
      .setDescription(`> ${ex ? `<@${ex.id}>` : 'Bilinmeyen'} tarafından <#${newChannel.id}> kanalı düzenlendi.`)
      // Fields: hepsi fix code block
      .addFields(
        {
          name: '<a:1390024057340039271:1413894433467797645> **Kanal ID**',
          value: `\`\`\`fix\n${newChannel.id}\n\`\`\``,
          inline: false
        },
        {
          name: '<a:1389975446560440482:1413636566185807963> **Değiştiren**',
          value: `\`\`\`fix\n${ex ? `${ex.username} - ${ex.id}` : 'Bilinmiyor'}\n\`\`\``,
          inline: false
        },
        {
          name: '<a:13899754405501378661:1413636586830037125> **Değişiklikler**',
          value: `\`\`\`fix\n${changes.length ? changes.join('\n') : 'Herhangi bir değişiklik yapılmadı.'}\n\`\`\``,
          inline: false
        },
        {
          name: '<a:1389975448816979968:1413894436357931100> **İzin Değişiklikleri**',
          value: `\`\`\`fix\n${owLines.length ? owLines.join('\n') : 'İzinlerde değişiklik yapılmadı.'}\n\`\`\``,
          inline: false
        },
        {
          name: '<a:1389975454496329728:1413636582300188862> **Zaman / Tarih**',
          value: `\`\`\`fix\n${trDate()}\n\`\`\``,
          inline: false
        }
      )
      .setThumbnail(ex?.displayAvatarURL?.() || client.user.displayAvatarURL());

    logCh.send({ embeds: [embed] }).catch(() => {});
  }
};
