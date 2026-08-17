// events/messageEditLog.js
const { Events, EmbedBuilder } = require('discord.js');
const log = require('../log.json'); // {"Stmsg-log":"KANAL_ID"} veya {"Stmessage-log":"KANAL_ID"}

// TR tarih helper
const trDate = (d = new Date()) =>
  new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(d);

module.exports = {
  name: Events.MessageUpdate,
  async execute(oldMessage, newMessage) {
    try {
      // DM / bot mesajları yok
      if (!newMessage?.guild) return;
      if (newMessage.author?.bot) return;

      // Partials ise fetch etmeyi dene
      if (oldMessage?.partial) { try { await oldMessage.fetch(); } catch {} }
      if (newMessage?.partial) { try { await newMessage.fetch(); } catch {} }

      // LOG kanalı ID (anahtar farkı olmasın diye iki olası key'i de dene)
      const logChId = log['Stmessage-log'] || log['Stmessage-log'];
      if (!logChId) return;

      const logCh =
        newMessage.guild.channels.cache.get(logChId) ||
        await newMessage.guild.channels.fetch(logChId).catch(() => null);
      if (!logCh?.isTextBased()) return;

      // İçerikler (Message Content intent yoSta boş gelebilir)
      const oldContent = (oldMessage?.content ?? '').trim();
      const newContent = (newMessage?.content ?? '').trim();

      const oldHadAtch = !!oldMessage?.attachments?.size;
      const newHadAtch = !!newMessage?.attachments?.size;

      // İçerik aynıysa ve ek durumu da değişmediyse log atma
      const contentSame = oldContent === newContent;
      const attachSame  = oldHadAtch === newHadAtch;
      if (contentSame && attachSame) return;

      // Fallback metinler
      const oldText =
        oldContent ||
        (oldHadAtch ? '[Ek(ler) vardı]' : 'İçerik yok / alınamadı.');
      const newText =
        newContent ||
        (newHadAtch ? '[Ek(ler) var]' : 'İçerik yok / alınamadı.');

      // İsim/pp güvenli al
      const displayName = newMessage.member?.displayName || newMessage.author?.username || 'Kullanıcı';
      const avatarURL   = newMessage.author?.displayAvatarURL({ size: 256 }) || undefined;

      const embed = new EmbedBuilder()
        .setAuthor({ name: displayName, iconURL: avatarURL })
        .setDescription(`> <#${newMessage.channelId}> kanalında bir mesaj düzenledi.`)
        .addFields(
          { name: '<a:13899754405501378661:1413636586830037125> **Eski Mesaj İçeriği**', value: `\`\`\`fix\n${oldText}\n\`\`\``, inline: false },
          { name: '<a:13899754405501378661:1413636586830037125> **Yeni Mesaj İçeriği**', value: `\`\`\`fix\n${newText}\n\`\`\``, inline: false },
          { name: '<a:1390024057340039271:1413894433467797645> **Mesaj Kanalı**', value: `\`\`\`fix\n#${newMessage.channel?.name ?? 'kanal'} - ${newMessage.channelId}\n\`\`\``, inline: false },
          { name: '<a:1389982028572655726:1413953942370517114> **Mesaj Düzenleme Zamanı**', value: `\`\`\`fix\n${trDate()}\n\`\`\``, inline: false },
        )
        .setThumbnail(avatarURL ?? null)
        .setColor(0xf1c40f)
        .setFooter({ text: "Synatx Bot's | Log Sistemi." });

      await logCh.send({ embeds: [embed] }).catch(() => {});
    } catch (err) {
      console.error('Mesaj düzenleme logu gönderilemedi:', err);
    }
  }
};
