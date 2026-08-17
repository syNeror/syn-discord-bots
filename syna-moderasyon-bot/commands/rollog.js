// rollog.js — Discord.js v14 slash komutu
// Bir kullanıcının rol geçmişini (ekleme/kaldırma), işlemi yapan kişiyi,
// işlem yöntemini (komut/bot mu, sağ tık/manuel mi), ve zamanı Unix zaman etiketiyle gösterir.

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  AuditLogEvent,
} = require("discord.js");
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rollog")
    .setDescription("Belirli bir kullanıcının rol geçmişini görüntüle.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption((opt) =>
      opt
        .setName("kullanıcı")
        .setDescription("Rol geçmişi görüntülenecek kişi")
        .setRequired(true)
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    // Sadece üst yetkili rolü kullanabilir
    if (config.üstyetkiliRolID && !interaction.member.roles.cache.has(config.üstyetkiliRolID)) {
      return interaction.reply({ content: '<:13899754306013758771:1414619305445691473> Bu komutu sadece **Üst Yetkili** rolü kullanabilir!', ephemeral: true });
    }

    const targetUser = interaction.options.getUser("kullanıcı", true);
    const guild = interaction.guild;

    // Yetki kontrolü (bot için)
    if (!guild.members.me.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
      return interaction.reply({
        content:
          "<:13899754306013758771:1414619305445691473> Denetim kaydını görüntülemek için `Denetim Kaydını Görüntüle` yetkisine ihtiyacım var.",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: false });

    // Denetim kaydından son 250 "Üye Rol Güncellemesi" girdisini çekiyoruz
    // (Discord tek seferde max 100 döndürür; birkaç tur alıyoruz)
    const fetched = [];
    let before; // snowflake id
    for (let i = 0; i < 3; i++) {
      const logs = await guild.fetchAuditLogs({
        type: AuditLogEvent.MemberRoleUpdate,
        limit: 100,
        before,
      });
      const entries = [...logs.entries.values()];
      if (entries.length === 0) break;
      fetched.push(...entries);
      before = entries[entries.length - 1].id;
      if (fetched.length >= 250) break;
    }

    // Hedef kullanıcıya ait olanları süz
    const userEntries = fetched
      .filter((e) => e.target?.id === targetUser.id)
      // en eskiden yeniye yerine, ekranda yeniler üstte görünsün
      .sort((a, b) => b.createdTimestamp - a.createdTimestamp);

    if (userEntries.length === 0) {
      return interaction.editReply({
        content: `ℹ️ ${targetUser} için yakın zamanda bir rol değişikliği bulunamadı.`,
      });
    }

    // Her girdi için; $add ve $remove değişikliklerini çöz
    const lines = [];
    for (const e of userEntries.slice(0, 15)) {
      const ts = Math.floor(e.createdTimestamp / 1000); // Unix saniye
      const executor = e.executor;

      // "Komutla/sağ tıkla" saptaması:
      // - İşlemi yapan bir bot ise "Komutla"
      // - ASti halde insan kullanıcı: "Sağtık" (manuel)
      const method =
        e.executor?.bot ? "Komutla" : "Sağtık";

      // Değişiklikler
      const adds =
        e.changes?.find((c) => c.key === "$add")?.new ?? [];
      const removes =
        e.changes?.find((c) => c.key === "$remove")?.new ?? [];

      for (const r of adds) {
        const roleMention = `<@&${r.id}>`;
        lines.push(
          `**${method}** ${executor} \`(<@${e.executor.id}>)\`\nTarih: <t:${ts}:F> (<t:${ts}:R>)\nRol: ${roleMention}\n`
        );
      }
      for (const r of removes) {
        const roleMention = `<@&${r.id}>`;
        lines.push(
          `**${method}]** ${executor} \`(<@${e.executor.id}>)\`\nTarih: <t:${ts}:F> (<t:${ts}:R>)\nRol: ${roleMention}\n`
        );
      }

      // Eğer hem add hem remove yoSta (nadir), yine de bir satır koy
      if (adds.length === 0 && removes.length === 0) {
        lines.push(
          `**${method}** ${executor} \`(<@${e.executor.id}>)\`\nTarih: <t:${ts}:F> (<t:${ts}:R>)\nDeğişiklik: (ayrıntı çözümlenemedi)\n`
        );
      }
    }

    const embed = new EmbedBuilder()
      .setAuthor({
        name: guild.name,
        iconURL: guild.iconURL({ size: 128 }) ?? undefined,
      })
      .setTitle("Kullanıcının Rol Geçmişi")
      .setDescription(
        `**Kullanıcı:** ${targetUser} (${targetUser.id})\n\n${lines.join(
          "\n\n"
        )}`
      )
      .setFooter({ text: `${config.brandFooter.split(' | ')[0]} | Rol Sistemi.`, iconURL: config.logo })
      .setColor(0x2f3136);

    return interaction.editReply({ embeds: [embed] });
  },
};
