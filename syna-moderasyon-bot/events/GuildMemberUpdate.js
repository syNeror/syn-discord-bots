// events/nameUpdate.js
const { Events, EmbedBuilder, AuditLogEvent } = require('discord.js');
const log = require('../log.json'); // {"Stisim-log": "KANAL_ID"}

// Küçük bekleme: Audit Log gecikmesini tolere eder
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

module.exports = {
  name: Events.GuildMemberUpdate,
  async execute(oldMember, newMember) {
    try {
      // TAKMA İSİM (nickname) değişmediyse çık
      const oldNick = oldMember.nickname ?? oldMember.user.username;
      const newNick = newMember.nickname ?? newMember.user.username;
      if (oldNick === newNick) return;

      // Log kanalı ID
      const logChId = log['Stisim-log'];
      if (!logChId) return;

      // Kanalı çek
      let logCh = newMember.guild.channels.cache.get(logChId);
      if (!logCh) {
        try {
          logCh = await newMember.guild.channels.fetch(logChId);
        } catch {
          return;
        }
      }
      if (!logCh || !logCh.isTextBased()) return;

      // --- Değiştiren kişiyi AUDIT LOG'dan sağlam yakala ---
      // Audit Log bazı durumlarda 200-800ms gecikir; kısa bir bekleme yardımcı olur
      await sleep(500);

      let executor = null;
      try {
        // Son birkaç kaydı çek, doğru hedefi ve 'nick' değişimini filtrele
        const fetched = await newMember.guild.fetchAuditLogs({
          type: AuditLogEvent.MemberUpdate,
          limit: 5
        });

        const now = Date.now();
        const entry = fetched.entries.find(e => {
          if (!e || !e.target || e.target.id !== newMember.id) return false;

          // Son 10 saniye içinde olmalı
          const fresh = now - e.createdTimestamp < 10_000;

          // 'nick' alanı değişmiş olmalı (bazı durumlarda null -> string ya da tersi)
          const changedNick = Array.isArray(e.changes) && e.changes.some(c =>
            (c.key === 'nick' || c.key === 'nickname')
          );

          return fresh && changedNick;
        }) || fetched.entries.find(e => e?.target?.id === newMember.id); // fallback: hedefe göre

        if (entry?.executor) executor = entry.executor;
      } catch {
        // audit log okunamazsa executor null kalır (izin yok / audit kapalı vs.)
      }

      // Embed (şekli aynen korunuyor)
      const embed = new EmbedBuilder()
        .setAuthor({ name: `${newMember.user.username}`, iconURL: newMember.user.displayAvatarURL({ size: 256 }) })
        .setDescription(`> ${executor ? `<@${executor.id}>` : 'Bilinmeyen'} tarafından <@${newMember.id}> kişisinin kullanıcı adı güncellendi.`)
        .addFields(
          { name: '<:13917260748992021391:1413930672187375688> **Eski Adı**', value: `\`\`\`fix\n${oldNick}\n\`\`\``, inline: false },
          { name: '<:13917260748992021391:1413930672187375688> **Yeni Adı**', value: `\`\`\`fix\n${newNick}\n\`\`\``, inline: false },
          { name: '<a:1389975446560440482:1413636566185807963> **Değiştiren Kişi**', value: `\`\`\`fix\n${executor ? `${executor.tag}` : 'Bilinmiyor'}\n\`\`\``, inline: false },
          { name: '<a:13899754405501378661:1413636586830037125> **Sebep**', value: '```fix\nBelirtilmemiş\n```', inline: false }
        )
        .setThumbnail(newMember.user.displayAvatarURL({ size: 256 })) // kullanıcının pps'i
        .setColor(0xff00ff)
        .setFooter({ text: "Synatx Bot's | Log Sistemi." });

      await logCh.send({ embeds: [embed] });
    } catch (err) {
      console.error("İsim değiştirme (nickname) logu gönderilemedi:", err);
    }
  }
};
