const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const config = require('../config.json');
const fs = require("fs");
const path = require("path");

const CEZA_PATH = path.join(__dirname, "..", "cezalar.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("perma-ban")
    .setDescription("Bir kullanıcıyı kalıcı olarak yasaklar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(option =>
      option.setName("kullanıcı").setDescription("Yasaklanacak kullanıcı").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("sebep").setDescription("Sebep (opsiyonel)").setRequired(true)
    ),

  async execute(interaction) {
    // Sadece üst yetkili rolü kullanabilir
    if (config.üstyetkiliRolID && !interaction.member.roles.cache.has(config.üstyetkiliRolID)) {
      return interaction.reply({ content: '<:13899754306013758771:1414619305445691473> Bu komutu sadece **Üst Yetkili** rolü kullanabilir!', ephemeral: true });
    }

    const target = interaction.options.getUser("kullanıcı");
    const reason = interaction.options.getString("sebep") || "Sebep belirtilmedi.";

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) return interaction.reply({ content: "Kullanıcı bulunamadı.", ephemeral: true });

    await member.ban({ reason: `PERMA BAN | ${reason}` });

    // Ceza kaydı
    let cezalar = [];
    if (fs.existsSync(CEZA_PATH)) {
      cezalar = JSON.parse(fs.readFileSync(CEZA_PATH, "utf8"));
    }
    const cezaId = cezalar.length + 1;
    const now = Date.now();

    cezalar.push({
      id: cezaId,
      guild: interaction.guildId,
      user: target.id,
      staff: interaction.user.id,
      type: "PERMA_BAN",
      reason,
      date: now,
      active: true
    });
    fs.writeFileSync(CEZA_PATH, JSON.stringify(cezalar, null, 2));

    const unix = Math.floor(now / 1000);
    const tarih = new Date();
const options = { day: "2-digit", month: "long", year: "numeric" };
const formattedDate = tarih.toLocaleDateString("tr-TR", options);


    const embed = new EmbedBuilder()
      .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
      .setDescription(`**Ceza Türü:** \`KALICI BAN\`\n**Ceza ID:** \`#${cezaId}\`\n\n**Yasaklanan:** ${target}\n**Yasaklayan:** ${interaction.user}\n\n**Tarih:** <t:${unix}:F> (<t:${unix}:R>)\n**Sebep:** \`\`\`fix\n${reason}. / ${interaction.user.username} / ${formattedDate}\n\`\`\``)
      .setColor("#acdce4")
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter({ text: `${config.brandFooter.split(' | ')[0]} | Ceza Sistemi.`, iconURL: config.logo });

    await interaction.reply({ embeds: [embed] });
  }
};
