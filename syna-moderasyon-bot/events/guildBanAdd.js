const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const log = require('../log.json');

module.exports = {
  name: Events.GuildBanAdd,
  async execute(ban) {
    try {
      const logChId = log['Stban-log'];
      if (!logChId) return;

      const channel =
        ban.guild.channels.cache.get(logChId) ||
        await ban.guild.channels.fetch(logChId).catch(() => null);

      if (!channel) return;

      // Audit log'tan yasaklayan
      const fetchedLogs = await ban.guild.fetchAuditLogs({ limit: 1, type: 22 });
      const logEntry = fetchedLogs.entries.first();
      const executor = logEntry?.executor;

      // --- LOG Embed ---
      const embed = new EmbedBuilder()
        .setAuthor({ name: ban.guild.name, iconURL: ban.guild.iconURL({ size: 256 }) })
        .setDescription(`${executor} tarafından ${ban.user} adlı kişi, <t:${Math.floor(Date.now()/1000)}:R> sunucudan yasaklandı.`)
        .addFields(
          { name: '<:1389975434665525298:1413932211538886847> **Ceza Türü**', value: `\`\`\`fix\nBAN\n\`\`\`` },
          { name: '<:13917260748992021391:1413930672187375688> **Yasaklanan**', value: `\`\`\`fix\n${ban.user.tag} (${ban.user.id})\n\`\`\`` },
          { name: '<a:1389975446560440482:1413636566185807963> **Yasaklayan**', value: `\`\`\`fix\n${executor ? `${executor.tag} (${executor.id})` : 'Bilinmiyor'}\n\`\`\`` },
          { name: '<a:13899754405501378661:1413636586830037125> **Sebep**', value: `\`\`\`fix\n${ban.reason || 'Belirtilmedi'}\n\`\`\`` }
        )
        .setThumbnail(ban.guild.iconURL({ size: 256 }))
      .setColor('#046404')
        .setFooter({ text: "Synatx Bot's | Log Sistemi." });

      await channel.send({ embeds: [embed] });

              const unix = Math.floor(Date.now() / 1000);
      // --- Kullanıcıya DM Embed ---
      const dmEmbed = new EmbedBuilder()
        .setAuthor({ name: ban.guild.name, iconURL: ban.guild.iconURL({ size: 256 }) })
        .setDescription(`<@${executor.id}> tarafından sunucudan ${executor.id} önce yasaklandınız \n\n **Ceza Türü** \`BAN\` \n **Yasaklayan** <@${executor.id}> \n **Sebep:** ${ban.reason || 'Sebep belirtilmedi.'}`)
      .setColor('#046404')
        .setFooter({ text: "Sorularınız varsa yetkililerle iletişime geçin." });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Yasaklanma Formu')
          .setStyle(ButtonStyle.Link)
          .setURL('https://senin-site-linkin.com/form') // burada kendi form linkini koy
      );

      await ban.user.send({ embeds: [dmEmbed], components: [row] }).catch(() => {
        console.warn(`<:13899754306013758771:1414619305445691473> ${ban.user.tag} DM alınamadı.`);
      });

    } catch (err) {
      console.error('<:13899754306013758771:1414619305445691473> Ban log/DM gönderilemedi:', err);
    }
  }
};
