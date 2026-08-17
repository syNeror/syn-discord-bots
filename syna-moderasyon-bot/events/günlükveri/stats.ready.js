// events/günlükveri/stats.ready.js
const { EmbedBuilder } = require('discord.js');
const path = require('path');
const logs = require(path.join(__dirname, '..', '..', 'log.json'));
const Stats = require(path.join(__dirname, '..', '..', 'utils', 'stats'));

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    const schedule = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 0, 0); // Gelecek 00:00
      const delay = next.getTime() - now.getTime();

      setTimeout(async () => {
        try {
          const guild = client.guilds.cache.first(); // tek sunucu varsayımı
          const ch = guild?.channels.cache.get(logs["Ststats-log"]);
          if (ch?.isTextBased()) {
            const todayTag = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
            const title = `${guild?.name ?? 'Sunucu'} #${todayTag} - Günlük Veri`;
            const body = [
              `**Günlük giriş sayısı:** ${Stats.state.joins}`,
              `**Günlük çıkış sayısı:** ${Stats.state.leaves}`,
              `**Günlük mesaj silme sayısı:** ${Stats.state.msgDeleted}`,
              `**Günlük mesaj düzenleme sayısı:** ${Stats.state.msgEdited}`,
              `**Günlük isim değiştirme sayısı:** ${Stats.state.nameChanged}`,
              `**Günlük rol alma sayısı:** ${Stats.state.roleTaken}`,
              `**Günlük rol verme sayısı:** ${Stats.state.roleGiven}`,
              `**Günlük yasaklama sayısı:** ${Stats.state.bans}`,
              `**Günlük yasak kaldırma sayısı:** ${Stats.state.unbans}`,
              `**Günlük uyarı sayısı:** ${Stats.state.warnings}`,
              `**Günlük whitelist ceza sayısı:** ${Stats.state.whitelistPenalty}`,
              `**Günlük kayıt sayısı:** ${Stats.state.registers}`,
              `**Günlük destek talebi sayısı:** ${Stats.state.tickets}`,
              `**Günlük atılan mesaj sayısı:** ${Stats.state.messagesSent}`,
              `**Günlük ses bilgisi:** ${Stats.formatHMS(Stats.state.voiceSeconds)}`
            ].join('\n');

            const embed = new EmbedBuilder()
              .setColor(0x2b2d31)
              .setAuthor({ name: title, iconURL: guild?.iconURL?.({ size: 256 }) ?? client.user.displayAvatarURL() })
              .setDescription(body)
              .setFooter({ text: "Synatx Bot's | Stats Sistemi." });

            await ch.send({ embeds: [embed] });
          }
        } finally {
          // Yeni gün
          Stats.resetForNewDay();
          schedule();
        }
      }, Math.max(1000, delay));
    };

    // İlk başlangıçta pencereyi bugüne çek
    Stats.setWindowStart(Stats.startOfToday());
    schedule();
  }
};
