// events/guildUpdate.js
// discord.js v14
const { AuditLogEvent, EmbedBuilder } = require('discord.js');

const log = require('../log.json'); // log.json'u import et
const LOG_CHANNEL_ID = log["Stserver-log"];

const trDate = (d = new Date()) =>
  new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeStyle: 'short' }).format(d);

// Audit Log'dan olayı yapan kişiyi çek (15 sn penceresi)
async function fetchExecutor(guild) {
  try {
    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.GuildUpdate, limit: 5 });
    const now = Date.now();
    const entry = [...logs.entries.values()].find(e => (now - e.createdTimestamp) < 15_000);
    return entry?.executor ?? null;
  } catch {
    return null;
  }
}

// Sayısal enum'ları okunur isme çevir
const Maps = {
  verificationLevel: ['Yok', 'Düşük', 'Orta', 'YüStek', 'En YüStek'],
  explicitContentFilter: ['Devre Dışı', 'Sadece Yeni Üyeler', 'Tüm Üyeler'],
  nsfwLevel: ['Varsayılan', 'Açık', 'Yaş Doğrulamalı', 'Güvenli'],
};

module.exports = {
  name: 'guildUpdate',
  /**
   * @param {import('discord.js').Guild} oldGuild
   * @param {import('discord.js').Guild} newGuild
   */
  async execute(oldGuild, newGuild) {
    const ch = newGuild.channels.cache.get(LOG_CHANNEL_ID);
    if (!ch?.isTextBased()) return;

    const ex = await fetchExecutor(newGuild);

    // Değişiklikleri yakala
    const diffs = [];

    if (oldGuild.name !== newGuild.name)
      diffs.push(`name:  ${oldGuild.name}  ->  ${newGuild.name}`);

    if (oldGuild.icon !== newGuild.icon)
      diffs.push(`icon:  ${oldGuild.icon ? 'var' : 'yok'}  ->  ${newGuild.icon ? 'var' : 'yok'}`);

    if (oldGuild.banner !== newGuild.banner)
      diffs.push(`banner:  ${oldGuild.banner ? 'var' : 'yok'}  ->  ${newGuild.banner ? 'var' : 'yok'}`);

    if (oldGuild.ownerId !== newGuild.ownerId)
      diffs.push(`owner:  ${oldGuild.ownerId}  ->  ${newGuild.ownerId}`);

    if (oldGuild.systemChannelId !== newGuild.systemChannelId)
      diffs.push(`systemChannel:  ${oldGuild.systemChannelId ?? 'yok'}  ->  ${newGuild.systemChannelId ?? 'yok'}`);

    if (oldGuild.rulesChannelId !== newGuild.rulesChannelId)
      diffs.push(`rulesChannel:  ${oldGuild.rulesChannelId ?? 'yok'}  ->  ${newGuild.rulesChannelId ?? 'yok'}`);

    if (oldGuild.publicUpdatesChannelId !== newGuild.publicUpdatesChannelId)
      diffs.push(`updatesChannel:  ${oldGuild.publicUpdatesChannelId ?? 'yok'}  ->  ${newGuild.publicUpdatesChannelId ?? 'yok'}`);

    if (oldGuild.afkChannelId !== newGuild.afkChannelId)
      diffs.push(`afkChannel:  ${oldGuild.afkChannelId ?? 'yok'}  ->  ${newGuild.afkChannelId ?? 'yok'}`);

    if (oldGuild.afkTimeout !== newGuild.afkTimeout)
      diffs.push(`afkTimeout:  ${oldGuild.afkTimeout}s  ->  ${newGuild.afkTimeout}s`);

    if (oldGuild.verificationLevel !== newGuild.verificationLevel)
      diffs.push(`verification:  ${Maps.verificationLevel[oldGuild.verificationLevel]}  ->  ${Maps.verificationLevel[newGuild.verificationLevel]}`);

    if (oldGuild.explicitContentFilter !== newGuild.explicitContentFilter)
      diffs.push(`contentFilter:  ${Maps.explicitContentFilter[oldGuild.explicitContentFilter]}  ->  ${Maps.explicitContentFilter[newGuild.explicitContentFilter]}`);

    if (oldGuild.nsfwLevel !== newGuild.nsfwLevel)
      diffs.push(`nsfwLevel:  ${Maps.nsfwLevel[oldGuild.nsfwLevel]}  ->  ${Maps.nsfwLevel[newGuild.nsfwLevel]}`);

    if (oldGuild.vanityURLCode !== newGuild.vanityURLCode)
      diffs.push(`vanityURL:  ${oldGuild.vanityURLCode ?? 'yok'}  ->  ${newGuild.vanityURLCode ?? 'yok'}`);

    if ((oldGuild.description ?? '') !== (newGuild.description ?? ''))
      diffs.push(`description:  ${(oldGuild.description ?? '—')}  ->  ${(newGuild.description ?? '—')}`);

    // Sadece gerçekten bir değişiklik varsa log at
    if (!diffs.length) return;

    const embed = new EmbedBuilder()
      .setColor(0x5865F2) // Discord mavisi
      .setAuthor({ name: ex ? ex.tag : 'Bilinmeyen', iconURL: ex?.displayAvatarURL?.() })
      // İlk satır: description
      .setDescription(`> ${ex ? `<@${ex.id}>` : 'Bilinmeyen'} isimli kişi sunucunun ayarlarını değiştirdi.`)
      // Alanlar: fix code block
      .addFields(
        {
          name: '<a:1389975446560440482:1413636566185807963> **Yetkili**',
          value: `\`\`\`fix\n${ex ? ex.username : 'Bilinmiyor'}\n\`\`\``,
          inline: false
        },
        {
          name: '<:1249678598466572379:1409954531332325406> **Değişiklikler**',
          value: `\`\`\`fix\n${diffs.join('\n')}\n\`\`\``,
          inline: false
        },
        {
          name: '<a:1389975454496329728:1413636582300188862> **Tarih**',
          value: `\`\`\`fix\n${trDate()}\n\`\`\``,
          inline: false
        }
      )
      .setThumbnail(ex?.displayAvatarURL?.() || newGuild.iconURL?.({ size: 256 }) || null);

    ch.send({ embeds: [embed] }).catch(() => {});
  }
};
