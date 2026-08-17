// events/roleUpdate.js
// discord.js v14
const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const log = require('../log.json'); // log.json'u import et
const LOG_CHANNEL_ID = log["Strole-log"];

const trDate = (d = new Date()) =>
  new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeStyle: 'short' }).format(d);

const diffPerms = (oldRole, newRole) => {
  const oldP = oldRole.permissions.toArray();
  const newP = newRole.permissions.toArray();
  return {
    added: newP.filter(p => !oldP.includes(p)),
    removed: oldP.filter(p => !newP.includes(p)),
  };
};

// Sadece anlamlı değişiklikleri logla (pozisyon değişimini yok say)
function isMeaningfulChange(oldRole, newRole) {
  const permsChanged = oldRole.permissions.bitfield !== newRole.permissions.bitfield;
  const nameChanged = oldRole.name !== newRole.name;
  const colorChanged = oldRole.color !== newRole.color; // .color sayı, .hexColor string
  const hoistChanged = oldRole.hoist !== newRole.hoist;
  const mentionableChanged = oldRole.mentionable !== newRole.mentionable;
  const iconChanged = oldRole.icon !== newRole.icon;
  const emojiChanged = oldRole.unicodeEmoji !== newRole.unicodeEmoji;

  const anyChanged = (
    permsChanged ||
    nameChanged ||
    colorChanged ||
    hoistChanged ||
    mentionableChanged ||
    iconChanged ||
    emojiChanged
  );

  // Sadece rawPosition değiştiyse anlamlı değil
  if (!anyChanged && oldRole.rawPosition !== newRole.rawPosition) return false;

  return anyChanged;
}

async function fetchExecutor(guild, targetId) {
  try {
    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.RoleUpdate, limit: 5 });
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
  name: 'roleUpdate',
  /**
   * @param {import('discord.js').Role} oldRole
   * @param {import('discord.js').Role} newRole
   * @param {import('discord.js').Client} client
   */
  async execute(oldRole, newRole, client) {
    // Anlamsız (sadece pozisyon) değişimleri atla
    if (!isMeaningfulChange(oldRole, newRole)) return;

    const ch = newRole.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!ch?.isTextBased()) return;

    const ex = await fetchExecutor(newRole.guild, newRole.id);
    const { added, removed } = diffPerms(oldRole, newRole);

    const embed = baseEmbed(newRole.color)
      .setAuthor({ name: ex ? ex.tag : 'Bilinmeyen', iconURL: ex?.displayAvatarURL?.() })
      // İlk satır sadece description
      .setDescription(`> ${ex ? `<@${ex.id}>` : 'Bilinmeyen'} tarafından <@&${newRole.id}> rolü güncellendi.`)
      // Devamı fields (fix code block)
      .addFields(
        ...(oldRole.name !== newRole.name ? [{
          name: '<:1249678598466572379:1409954531332325406> Eski Rol Adı',
          value: `\`\`\`fix\n${oldRole.name}\n\`\`\``,
          inline: false
        }, {
          name: '<:1249678598466572379:1409954531332325406> Yeni Rol Adı',
          value: `\`\`\`fix\n${newRole.name}\n\`\`\``,
          inline: false
        }] : []),

        ...(oldRole.hexColor !== newRole.hexColor ? [{
          name: '<:1249678268878295087:1409954519001071698> Eski Renk',
          value: `\`\`\`fix\n${oldRole.hexColor || '#000000'}\n\`\`\``,
          inline: false
        }, {
          name: '<:1249678268878295087:1409954519001071698> Yeni Renk',
          value: `\`\`\`fix\n${newRole.hexColor || '#000000'}\n\`\`\``,
          inline: false
        }] : []),

        ...(added.length ? [{
          name: '<:1269331884299653263:1409954494632165446> Eklenen İzinler',
          value: `\`\`\`fix\n${added.join(', ')}\n\`\`\``,
          inline: false
        }] : []),

        ...(removed.length ? [{
          name: '<:1269331884299653263:1409954494632165446> Kaldırılan İzinler',
          value: `\`\`\`fix\n${removed.join(', ')}\n\`\`\``,
          inline: false
        }] : []),

        {
          name: '<:1249678270862069780:1408509202594398218> Düzenleyen',
          value: `\`\`\`fix\n${ex ? `${ex.tag} - ${ex.id}` : 'Bilinmiyor'}\n\`\`\``,
          inline: false
        },
        {
          name: '<:1249678595446800446:1408509214107893850> Tarih',
          value: `\`\`\`fix\n${trDate()}\n\`\`\``,
          inline: false
        }
      )
      .setColor(newRole.hexColor || '#000000')
      .setThumbnail(ex?.displayAvatarURL?.() || client.user.displayAvatarURL());

    ch.send({ embeds: [embed] }).catch(() => {});
  }
};
