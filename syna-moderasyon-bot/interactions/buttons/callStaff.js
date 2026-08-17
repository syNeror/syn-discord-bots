// interactions/buttons/callStaff.js
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  time,
  ChannelType
} = require('discord.js');
const cfg = require('../../config.json');

// KullanıcıID -> timestamp(ms) (bir sonraki bildirim zamanı)
const cooldown = new Map();
const COOLDOWN_MS = 15 * 60 * 1000;

module.exports = {
  customId: 'call_staff',

  /**
   * @param {import('discord.js').ButtonInteraction} interaction
   */
  async run(interaction) {
    const { guild, member, user } = interaction;

    // Güvenlik
    if (!guild || !member || member.user.bot) {
      return interaction.reply({ content: 'Geçersiz işlem.', ephemeral: true });
    }

    const now = Date.now();
    const until = cooldown.get(user.id) || 0;

    // --- COOLDOWN DEVREDE ---
    if (now < until) {
      const leftMs = until - now;
      const leftMin = Math.ceil(leftMs / 60000);

      const relax = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Rahatlaa')
          .setStyle(ButtonStyle.Link)
          .setURL(cfg.relaxGifUrl)
      );

      const coolEmbed = new EmbedBuilder()
        .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
        .setTitle(`Tekrar Yetkililere Bildirim Göndermek İçin Kalan Süre: ${leftMin} Dakika`)
        .setDescription('Beklerken butona basıp rahatlayabilirsin')
        .setThumbnail(cfg.panelThumb)
        .setColor(0x2b2d31)
        .setFooter({ text: `${cfg.brandName}` });

      return interaction.reply({ embeds: [coolEmbed], components: [relax], ephemeral: true });
    }

    // --- İLK BASIŞ / COOLDOWN BİTMİŞ ---
    cooldown.set(user.id, now + COOLDOWN_MS);

    // 1) Varsa kullanıcıyı mülakat ses kanalına taşı
    try {
      const targetVc = guild.channels.cache.get(cfg.interviewVoiceChannelId);
      if (targetVc && targetVc.type === ChannelType.GuildVoice) {
        if (!member.voice?.channelId || member.voice.channelId !== targetVc.id) {
          await member.voice.setChannel(targetVc);
        }
      }
    } catch (_) { /* taşıyamadıysak sessizce geç */ }

    // 2) Yetkili kanalına ping + log
    try {
      const notifyCh = guild.channels.cache.get(cfg.notifyChannelId);
      if (notifyCh && notifyCh.isTextBased()) {
        const whenAbs = time(Math.floor(now / 1000), 'f'); // 30 Ocak 2025 11:54
        await notifyCh.send(
          `<@${user.id}> **Adlı Kişi** ${whenAbs} zamanında Butona Bastı! ` +
          `Mülakatta Kayıt İçin Sizi Bekliyor onu bekletmee. <@&${cfg.staffRoleId}>`
        );
      }
    } catch (_) {}

    // 3) Kullanıcıya ephemeral bilgilendirme
    const waitCh = guild.channels.cache.get(cfg.waitTextChannelId);
    const link = waitCh?.isTextBased() ? `[Kayıt bekleme](https://discord.com/channels/${guild.id}/${waitCh.id})` : 'Kayıt bekleme';

    const userEmbed = new EmbedBuilder()
      .setAuthor({ name: 'Synatx Video', iconURL: cfg.panelThumb })
      .addFields(
        { name: 'Yetkililere bildirimin gönderildi!', value: '\u200B' },
        { name: 'Merhaba Hoşgeldin!', value: `${user.username}` },
        { name: 'Bu Sırada Mülakat Kanalına Geçiş Sağlayıp Bekleyebilirsin.', value: `🔊 ${link}` }
      )
      .setThumbnail('attachment://thumb.png')
      .setColor(0x2b2d31)
      .setFooter({ text: `${cfg.brandName} • Mülakat Sistemi. • bugün saat ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Kayıt bekleme')
        .setStyle(ButtonStyle.Link)
        .setURL(waitCh ? `https://discord.com/channels/${guild.id}/${waitCh.id}` : 'https://discord.com')
    );

    await interaction.reply({
      embeds: [userEmbed],
      components: [row],
      files: [{ attachment: cfg.panelThumb, name: 'thumb.png' }],
      ephemeral: true
    });
  }
};
