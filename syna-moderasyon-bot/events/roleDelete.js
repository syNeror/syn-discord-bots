// events/roleDelete.js
// discord.js v14
const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const log = require('../log.json'); // log.json'u import et
const LOG_CHANNEL_ID = log["Strole-log"];

const trDate = (d = new Date()) =>
  new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeStyle: 'short' }).format(d);

async function fetchExecutor(guild, targetId) {
  try {
    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 5 });
    const now = Date.now();
    const entry = [...logs.entries.values()].find(
      e => e.target?.id === targetId && (now - e.createdTimestamp) < 15_000
    );
    return entry?.executor || null;
  } catch {
    return null;
  }
}

function baseEmbed(color) {
  return new EmbedBuilder()
    .setColor(color ?? 0x2b2d31)
    .setFooter({ text: "Synatx Bot's Log Sistemi." });
}

module.exports = {
  name: 'roleDelete',
  /**
   * @param {import('discord.js').Role} role
   * @param {import('discord.js').Client} client
   */
  async execute(role, client) {
    const ch = role.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!ch?.isTextBased()) return;

    const ex = await fetchExecutor(role.guild, role.id);

    const embed = baseEmbed(0x5D0303) // koyu kırmızı
      .setAuthor({ name: ex ? ex.tag : 'Bilinmeyen', iconURL: ex?.displayAvatarURL?.() })
      // İlk satır: sadece description
      .setDescription(`> ${ex ? `<@${ex.id}>` : 'Bilinmeyen'} tarafından <@&${role.id}> **rolü silindi.**`)
      // Devamı: fields (hepsi fix code block)
      .addFields(
        {
          name: '<:1249678598466572379:1409954531332325406> Rol Adı',
          value: `\`\`\`fix\n${role.name}\n\`\`\``,
          inline: false
        },
        {
          name: '<:1249678598466572379:1409954531332325406> Rol ID',
          value: `\`\`\`fix\n${role.id}\n\`\`\``,
          inline: false
        },
        {
          name: '<:1249678268878295087:1409954519001071698> Renk',
          value: `\`\`\`fix\n${role.hexColor || '#000000'}\n\`\`\``,
          inline: false
        },
        {
          name: '<:1249678270862069780:1408509202594398218> Silen',
          value: `\`\`\`fix\n${ex ? `${ex.tag} - ${ex.id}` : 'Bilinmiyor'}\n\`\`\``,
          inline: false
        },
        {
          name: '<:1249678595446800446:1408509214107893850> Tarih',
          value: `\`\`\`fix\n${trDate()}\n\`\`\``,
          inline: false
        }
      )
      .setThumbnail(ex?.displayAvatarURL?.() || client.user.displayAvatarURL())
                .setColor("#5D0303"); // kırmızı

    ch.send({ embeds: [embed] }).catch(() => {});
  }
};
