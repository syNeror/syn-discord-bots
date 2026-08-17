// commands/yetkili.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events
} = require('discord.js');
const cfg = require('../config.json');


// ==== Modul-geneli durum ====
const COOLDOWN_MS = 15 * 60 * 1000;            // 15 dakika
const lastPress = new Map();                    // userId -> timestamp
let handlerWired = false;                       // bir kere bağla

function wireInteractionHandler(client) {
  if (handlerWired) return;
  handlerWired = true;

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;

    // ---- Rahatla butonu ----
    if (interaction.customId === 'relax') {
      try {
        await interaction.reply({ ephemeral: true, content: 'Derin bir nefes al 😌' });
      } catch {}
      return;
    }

    // ---- Mülakattayım butonu ----
    if (interaction.customId !== 'call_staff') return;

    try {
      await interaction.deferReply({ ephemeral: true });
    } catch {}

    const now = Date.now();
    const prev = lastPress.get(interaction.user.id);
        const username = interaction.user.username;

    // Cooldown sürüyorsa 3. görseldeki uyarı
    if (prev && (now - prev) < COOLDOWN_MS) {
      const remaining = COOLDOWN_MS - (now - prev);
      const mins = Math.ceil(remaining / 60000);

      const warnEmbed = new EmbedBuilder()
        .setAuthor({ name: `${username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTitle(`Tekrar Yetkililere Bildirim Göndermek İçin Kalan Süre: ${mins} Dakika`)
        .setDescription('Beklerken butona basıp rahatlayabilirsin')
        .setThumbnail(cfg.relaxImage)
        .setColor(0x2b2d31)
      .setFooter({ text: cfg.brandFooter || '' });

      const relaxRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('relax')
          .setLabel('Rahatla')
          .setStyle(ButtonStyle.Secondary)
      );

      try {
        await interaction.editReply({ embeds: [warnEmbed], components: [relaxRow] });
      } catch {}
      return;
    }

    // ---- Cooldown yoSta 1) loga duyuru + 2) kullanıcıya onay ----

    // 1) Log kanalına (görsel-1 benzeri)
try {
  const logCh = interaction.guild.channels.cache.get(cfg.interviewLogChannelId);
  if (logCh) {
    const staffMention = cfg.staffRoleId ? `<@&${cfg.staffRoleId}>` : '';

    // Unix timestamp (saniye cinsinden)
    const unix = Math.floor(Date.now() / 1000);

    // Discord timestamp formatları
    const discordTamTarih = `<t:${unix}:F>`; // 30 Ocak 2025 11:54
    const discordRelative = `<t:${unix}:R>`; // (bir dakika önce)

    await logCh.send(
      `${interaction.user} **Adlı Kişi** ${discordTamTarih} ${discordRelative} zamanında Butona Bastı! Mülakatta Kayıt İçin Sizi Bekliyor, onu bekletme. ${staffMention}`
    );
  }
} catch (e) {
  console.error('Log mesajı gönderilemedi:', e);
}




    // 2) Kullanıcıya ephemeral onay (görsel-2 benzeri)
    const jumpUrl = `https://discord.com/channels/${interaction.guildId}/${interaction.channelId}`;
    const kayitbekleme = cfg.kayitkanal;

    const userEmbed = new EmbedBuilder()
      .setAuthor({ name: `${username}`, iconURL: interaction.user.displayAvatarURL() })
      .setTitle(`${username}`)
      .setDescription(
        `**Yetkililere bildirimin gönderildi!**\nMerhaba Hoşgeldin! ${interaction.user.username}\nBu Sırada Mülakat Kanalına Geçiş Sağlayıp Bekleyebilirsin.\n--> <#${kayitbekleme}>`
      )
      .setColor(0x2b2d31)
      .setFooter({ text: cfg.brandFooter || '' });

    const userRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setURL(jumpUrl)
        .setLabel('🔁 Kayıt bekleme')
    );

    try {
      await interaction.editReply({ embeds: [userEmbed] });
    } catch {}

    // Cooldown başlat
    lastPress.set(interaction.user.id, now);
    setTimeout(() => lastPress.delete(interaction.user.id), COOLDOWN_MS);
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yetkili')
    .setDescription('Yetkili çağırma panelini gönderir.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const { client, channel } = interaction;

    // Buton dinleyicisini tek seferliğine bağla
    wireInteractionHandler(client);

    await interaction.deferReply({ ephemeral: true });

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Yetkili Çağırma' })
      .setTitle('Synatx Video Sunucumuza Hoşgeldiniz.')
      .setDescription('Hızlıca Kayıt Olmak için Yetkililerimize Alttaki Butona Basarak Haber Verebilirsiniz.')
      .setThumbnail(cfg.logo)
      .setImage(cfg.banner)
      .setColor(0x2b2d31)
      .setFooter({ text: cfg.brandFooter || '' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('call_staff')
        .setLabel('Mülakattayım')
        .setStyle(ButtonStyle.Success)
    );

    await channel.send({ embeds: [embed], components: [row] });

    await interaction.deleteReply().catch(() => {});
  }
};
