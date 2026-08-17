const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  PermissionFlagsBits, 
  ActionRowBuilder, 
  StringSelectMenuBuilder 
} = require("discord.js");
const config = require('../config.json');

/* -------------------- Ortak Yardımcılar -------------------- */
function canBotEdit(interaction, target, role) {
  const me = interaction.guild.members.me;
  if (!me) return false;
  if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) return false;

  if (role.id === interaction.guild.id || role.managed) return false;

  const botHigherThanRole = me.roles.highest.comparePositionTo(role) > 0;
  if (target.id === interaction.guild.ownerId) return false;
  const botHigherThanTarget = me.roles.highest.comparePositionTo(target.roles.highest) > 0;

  return botHigherThanRole && botHigherThanTarget;
}

function canActorEditTarget(interaction, target, role) {
  const actorMember = interaction.member;
  if (!actorMember?.permissions?.has(PermissionFlagsBits.ManageRoles)) return false;

  const actorIsOwner = actorMember.id === interaction.guild.ownerId;
  const actorHigherThanTarget = actorIsOwner || actorMember.roles.highest.comparePositionTo(target.roles.highest) > 0;
  const actorHigherThanRole = actorIsOwner || actorMember.roles.highest.comparePositionTo(role) > 0;

  const notEveryoneOrManaged = role.id !== interaction.guild.id && !role.managed;

  return actorHigherThanTarget && actorHigherThanRole && notEveryoneOrManaged;
}

function buildThumb(interaction) {
  return (interaction.guild.iconURL && interaction.guild.iconURL({ dynamic: true }))
    || interaction.client.user.displayAvatarURL();
}

function makeEmbed({ interaction, actor, target, role, action }) {
  const actionText =
    action === "ver" ? "istenilen rol **verildi**." :
    action === "al"  ? "istenilen rol **alındı**." : "işlem uygulandı.";

  return new EmbedBuilder()
    .setAuthor({
      name: interaction.user.username,
      iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
    })
    .setDescription(
      `${actor} tarafından bir kullanıcıya başarılı bir şekilde ${actionText}\n` +
      `**Kullanıcı:** ${target}\n` +
      `**Yetkili:** ${actor}\n` +
      `**Rol:** ${role}\n` +
      `**Tarih:** ${new Date().toLocaleString("tr-TR")}`
    )
    .setFooter({ text: "Synatx Bot's | Rol Sistemi." })
    .setThumbnail(buildThumb(interaction));
}

/* --- İzinleri Türkçe Çeviri (Sadece İsim) --- */
const permissionTranslations = {
  Administrator: "Yönetici",
  BanMembers: "Üyeleri Yasakla",
  KickMembers: "Üyeleri At",
  ManageChannels: "Kanalları Yönet",
  ManageRoles: "Rolleri Yönet",
  ManageGuild: "Sunucuyu Yönet",
  ManageMessages: "Mesajları Yönet",
  MentionEveryone: "Herkesi Etiketle",
  ManageNicknames: "Takma Adları Yönet",
  ChangeNickname: "Takma Ad Değiştir",
  ManageEmojisAndStickers: "İfadeleri Yönet",
  ManageWebhooSt: "Webhookları Yönet",
  ManageThreads: "Alt Başlıkları Yönet",
  CreateInstantInvite: "Davet Oluştur",
  SendMessages: "Mesaj Gönder",
  SendTTSMessages: "TTS Mesaj Gönder",
  EmbedLinSt: "Bağlantı Yerleştir",
  AttachFiles: "Dosya Ekle",
  ReadMessageHistory: "Mesaj Geçmişini Oku",
  UseExternalEmojis: "Harici Emoji Kullan",
  AddReactions: "Tepki Ekle",
  Connect: "Ses Kanalına Bağlan",
  Speak: "Konuş",
  MuteMembers: "Üyeleri Sustur",
  DeafenMembers: "Üyeleri Sağırlaştır",
  MoveMembers: "Üyeleri Taşı",
  UseVAD: "Ses Etkinliğini Kullan",
  PrioritySpeaker: "Öncelikli Konuşmacı",
};

/* -------------------- Komut Tanımı -------------------- */
module.exports = {
  data: new SlashCommandBuilder()
    .setName("rol")
    .setDescription("Kullanıcılara rol ver/al veya rol bilgisi al.")
    .addSubcommand(sub =>
      sub
        .setName("ver")
        .setDescription("Bir kullanıcıya rol verir.")
        .addUserOption(o =>
          o.setName("kullanıcı")
            .setDescription("Rol verilecek kullanıcı")
            .setRequired(true))
        .addRoleOption(o =>
          o.setName("rol")
            .setDescription("Verilecek rol")
            .setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName("al")
        .setDescription("Bir kullanıcıdan rol alır.")
        .addUserOption(o =>
          o.setName("kullanıcı")
            .setDescription("Rol alınacak kullanıcı")
            .setRequired(true))
        .addRoleOption(o =>
          o.setName("rol")
            .setDescription("Alınacak rol")
            .setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName("bilgi")
        .setDescription("Bir rol hakkında bilgi verir.")
        .addRoleOption(o =>
          o.setName("rol")
            .setDescription("Bilgisi alınacak rol")
            .setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    // Sadece yetkili rolü kullanabilir
    if (config.yetkiliRolId && !interaction.member.roles.cache.has(config.yetkiliRolId)) {
      return interaction.reply({ content: '<:13899754306013758771:1414619305445691473> Bu komutu sadece **Yetkili** rolü kullanabilir!', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();

    /* --------- ROL VER --------- */
    if (sub === "ver") {
      const target = interaction.options.getMember("kullanıcı");
      const role = interaction.options.getRole("rol");
      const actorUser = interaction.user;
      const actorTag = actorUser.tag;

      if (!target) {
        return interaction.reply({ content: "Kullanıcı bulunamadı.", ephemeral: true });
      }

      // Kendine rol verme kontrolü
      if (target.id === actorUser.id) {
        const errorEmbed = new EmbedBuilder()
          .setAuthor({
            name: actorUser.username,
            iconURL: actorUser.displayAvatarURL({ dynamic: true })
          })
          .setDescription("<:13899754306013758771:1414619305445691473> | Kendine rol vermezsin.")
          .setFooter({
            text: "Synatx",
            iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
          })
          .setColor("#add8e6");
        return interaction.reply({ embeds: [errorEmbed] });
      }

      // Kişi zaten bu role sahip mi kontrolü
      if (target.roles.cache.has(role.id)) {
        const errorEmbed = new EmbedBuilder()
          .setAuthor({
            name: actorUser.username,
            iconURL: actorUser.displayAvatarURL({ dynamic: true })
          })
          .setDescription("<:13899754306013758771:1414619305445691473> | Kişi zaten vermek istediğin role sahip.")
          .setFooter({
            text: "Synatx",
            iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
          })
          .setColor("#add8e6");
        return interaction.reply({ embeds: [errorEmbed] });
      }

      // Kendinden üst rol verme kontrolü
      if (target.id === actorUser.id && interaction.member.roles.highest.comparePositionTo(role) <= 0) {
        const errorEmbed = new EmbedBuilder()
          .setAuthor({
            name: actorUser.username,
            iconURL: actorUser.displayAvatarURL({ dynamic: true })
          })
          .setDescription("<:13899754306013758771:1414619305445691473> | Kendinden üst bir rolü kendine veremezsin.")
          .setFooter({
            text: "Synatx",
            iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
          })
          .setColor("#add8e6");
        return interaction.reply({ embeds: [errorEmbed] });
      }

      if (!canBotEdit(interaction, target, role)) {
        return interaction.reply({
          content: "İşlem gerçekleştirilemedi. Botun rol pozisyonu yetersiz olabilir ya da rol yönetimli/@everyone.",
          ephemeral: true,
        });
      }
      if (!canActorEditTarget(interaction, target, role)) {
        return interaction.reply({
          content: "Bu işlemi bu kullanıcı/rol üzerinde yapamazsın. Rol/üye hiyerarşini ve izinlerini kontrol et.",
          ephemeral: true,
        });
      }

      await target.roles.add(role, `Rol verildi: ${actorTag}`);
      const embed = makeEmbed({ interaction, actor: actorUser, target, role, action: "ver" });
      return interaction.reply({ embeds: [embed] });
    }

    /* --------- ROL AL --------- */
    if (sub === "al") {
      const target = interaction.options.getMember("kullanıcı");
      const role = interaction.options.getRole("rol");
      const actorUser = interaction.user;
      const actorTag = actorUser.tag;

      if (!target) {
        return interaction.reply({ content: "Kullanıcı bulunamadı.", ephemeral: true });
      }

      // Kendine rol alma kontrolü
      if (target.id === actorUser.id) {
        const errorEmbed = new EmbedBuilder()
          .setAuthor({
            name: actorUser.username,
            iconURL: actorUser.displayAvatarURL({ dynamic: true })
          })
          .setDescription("<:13899754306013758771:1414619305445691473> | Kendine rol alamazsın.")
          .setFooter({
            text: "Synatx",
            iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
          })
          .setColor("#add8e6");
        return interaction.reply({ embeds: [errorEmbed] });
      }

      // Kişi bu role sahip değil mi kontrolü
      if (!target.roles.cache.has(role.id)) {
        const errorEmbed = new EmbedBuilder()
          .setAuthor({
            name: actorUser.username,
            iconURL: actorUser.displayAvatarURL({ dynamic: true })
          })
          .setDescription("<:13899754306013758771:1414619305445691473> | Kişi zaten almak istediğin role sahip değil.")
          .setFooter({
            text: "Synatx",
            iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
          })
          .setColor("#add8e6");
        return interaction.reply({ embeds: [errorEmbed] });
      }

      // Kendinden üst rol alma kontrolü
      if (target.id === actorUser.id && interaction.member.roles.highest.comparePositionTo(role) <= 0) {
        const errorEmbed = new EmbedBuilder()
          .setAuthor({
            name: actorUser.username,
            iconURL: actorUser.displayAvatarURL({ dynamic: true })
          })
          .setDescription("<:13899754306013758771:1414619305445691473> | Kendinden üst bir rolü kendinden alamazsın.")
          .setFooter({
            text: "Synatx",
            iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
          })
          .setColor("#add8e6");
        return interaction.reply({ embeds: [errorEmbed] });
      }

      if (!canBotEdit(interaction, target, role)) {
        return interaction.reply({
          content: "İşlem gerçekleştirilemedi. Botun rol pozisyonu yetersiz olabilir ya da rol yönetimli/@everyone.",
          ephemeral: true,
        });
      }
      if (!canActorEditTarget(interaction, target, role)) {
        return interaction.reply({
          content: "Bu işlemi bu kullanıcı/rol üzerinde yapamazsın. Rol/üye hiyerarşini ve izinlerini kontrol et.",
          ephemeral: true,
        });
      }

      await target.roles.remove(role, `Rol alındı: ${actorTag}`);
      const embed = makeEmbed({ interaction, actor: actorUser, target, role, action: "al" });
      return interaction.reply({ embeds: [embed] });
    }

    /* --------- ROL BİLGİ --------- */
    if (sub === "bilgi") {
      const role = interaction.options.getRole("rol");

      // İlk yükleniyor mesajı
      const loadingMsg = await interaction.reply({ content: "> **Veriler Çekiliyor Lütfen Bekleyiniz...**", fetchReply: true });

      setTimeout(async () => {
        const members = role.members.map(m => m.user);

        // Rol yetkileri
        const permissions = role.permissions.toArray();
        const formattedPerms = permissions.length
          ? permissions.map(p => `- ${permissionTranslations[p] || p}`).join("\n")
          : "<:13899754306013758771:1414619305445691473> Yetki yok.";

        const embed = new EmbedBuilder()
          .setAuthor({ name: `${interaction.user.username} - BİLGİ`, iconURL: interaction.user.displayAvatarURL() })
          .setDescription(
            `**Rol İsmi:** ${role.name}\n` +
            `**Rol ID:** ${role.id}\n` +
            `**Rol Renk:** ${role.hexColor}\n` +
            `**Roldeki Kullanıcı Sayısı:** ${members.length}\n` +
            `**Rol Oluşturulma Tarihi:** <t:${Math.floor(role.createdTimestamp / 1000)}:F> (<t:${Math.floor(role.createdTimestamp / 1000)}:R>)\n\n` +
            `**Rol Yetkileri:**\n\`\`\`fix\n${formattedPerms}\n\`\`\``
          )
          .setThumbnail(interaction.guild.iconURL())
          .setFooter({ text: `${config.brandFooter.split(' | ')[0]} | Rol Sistemi.`, iconURL: config.logo })
          .setColor("#add8e6");

        const select = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`rolmenu_${role.id}`)
            .setPlaceholder("Filtrelenmiş Veriler İçin Tıkla!")
            .addOptions([
              { label: "Roldeki Kişileri Göster", value: "kisiler" },
              { label: "Roldeki Kişilerin ID'lerini Göster", value: "idler" },
              { label: "Roldeki Kullanıcıların Etiketlerini Göster", value: "etiketler" },
              { label: "Roldeki Seste Bulunanları Göster", value: "seste" }
            ])
        );

        await loadingMsg.edit({ content: "", embeds: [embed], components: [select] });
      }, 2000);
    }
  },
};
