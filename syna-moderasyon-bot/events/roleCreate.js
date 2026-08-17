// roleCreate.js
const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const log = require('../log.json'); // log.json'u import et
const LOG_CHANNEL_ID = log["Strole-log"];

const trDate = (d = new Date()) =>
  new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeStyle: 'short' }).format(d);
const listPerms = (role) => role.permissions.toArray();

async function fetchExecutor(guild, type, targetId) {
  try {
    const logs = await guild.fetchAuditLogs({ type, limit: 5 });
    const entry = logs.entries.find(e => e.target?.id === targetId) || logs.entries.first();
    return entry?.executor || null;
  } catch { return null; }
}
function baseEmbed(color) {
  return new EmbedBuilder().setColor(color ?? 0x2b2d31).setFooter({ text: "Synatx Bot's Log Sistemi." });
}

module.exports = {
  name: 'roleCreate',
  async execute(role, client) {
    const ch = role.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!ch?.isTextBased()) return;

    const ex = await fetchExecutor(role.guild, AuditLogEvent.RoleCreate, role.id);

    const embed = baseEmbed(role.color)
      .setAuthor({ name: ex ? ex.tag : 'Bilinmeyen', iconURL: ex?.displayAvatarURL?.() })
      .setDescription(`> ${ex ? `<@${ex.id}>` : 'Bilinmeyen'} tarafından <@&${role.id}> rolü oluşturuldu.`)
      .addFields(
        { name: '<:1249678595446800446:1408509214107893850> Rol Adı', value: `\`\`\`fix\n${role.name}\n\`\`\``, inline: false },
        { name: '<:1249678598466572379:1409954531332325406> Rol ID', value: `\`\`\`fix\n${role.id}\n\`\`\``, inline: false },
        { name: '<:1249678268878295087:1409954519001071698> Renk', value: `\`\`\`fix\n${role.hexColor || '#000000'}\n\`\`\``, inline: false },
        { name: '<:12496786001317111841:1411731804972519446> İzinler', value: `\`\`\`fix\n${listPerms(role).length ? listPerms(role).join(', ') : 'İzinler Kapalı'}\n\`\`\``, inline: false },
        { name: '<:1249678341280239697:1408509223171788923> Tarih', value: `\`\`\`fix\n${trDate()}\n\`\`\``, inline: false },
      )
      .setColor('#046404')
      .setThumbnail(ex?.displayAvatarURL?.() || client.user.displayAvatarURL());

    ch.send({ embeds: [embed] }).catch(() => {});
  }
};
