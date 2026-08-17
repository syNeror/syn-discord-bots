const { Events, EmbedBuilder } = require('discord.js');
const log = require('../log.json'); // {"Stmsg-log": "KANAL_ID"}

// TR tarih helper
const trDate = (d = new Date()) =>
  new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(d);

module.exports = {
  name: Events.MessageDelete,
  async execute(message) {
    try {
      if (!message?.guild) return;
      if (message.author?.bot) return;

      // Partials için
      if (message?.partial) { try { await message.fetch(); } catch {} }

      const logChId = log['Stmessage-log'];
      if (!logChId) return;

      const logCh =
        message.guild.channels.cache.get(logChId) ||
        await message.guild.channels.fetch(logChId).catch(() => null);
      if (!logCh?.isTextBased()) return;

      const content = (message.content ?? '').trim();
      const body = content || (message.attachments?.size ? '[Ek(ler) vardı]' : 'İçerik yok / alınamadı.');

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${message.member?.displayName ?? message.author?.username ?? 'Kullanıcı'}`,
          iconURL: message.author?.displayAvatarURL({ size: 256 }) ?? undefined
        })
        .setDescription(`> <#${message.channelId}> kanalında bir mesaj sildi.`)
        .addFields(
          { name: '<a:13899754405501378661:1413636586830037125> **Mesaj İçeriği**', value: `\`\`\`fix\n${body}\n\`\`\``, inline: false },
          { name: '<a:1390024057340039271:1413894433467797645> **Mesaj Kanalı**', value: `\`\`\`fix\n#${message.channel?.name ?? 'kanal'} - ${message.channelId}\n\`\`\``, inline: false },
          { name: '<a:1389982028572655726:1413953942370517114> **Mesaj Silinme Zamanı**', value: `\`\`\`fix\n${trDate()}\n\`\`\``, inline: false }
        )
        .setThumbnail(message.author?.displayAvatarURL({ size: 256 }) ?? null)
        .setColor(0xff0000) // silme için kırmızı
        .setFooter({ text: "Synatx Bot's | Log Sistemi." });

      await logCh.send({ embeds: [embed] }).catch(() => {});
    } catch (err) {
      console.error('Mesaj silme logu gönderilemedi:', err);
    }
  }
};
