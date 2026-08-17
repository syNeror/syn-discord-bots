const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const config = require('../config.json');
const fs = require("fs");
const path = require("path");

const CEZA_PATH = path.join(__dirname, "..", "cezalar.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("perma-unban")
    .setDescription("Kalıcı yasağı kaldırır.")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(option =>
      option.setName("kullanıcı").setDescription("Yasağı kaldırılacak kullanıcı").setRequired(true)
    ),

  async execute(interaction) {
    // Sadece üst yetkili rolü kullanabilir
    if (config.üstyetkiliRolID && !interaction.member.roles.cache.has(config.üstyetkiliRolID)) {
      return interaction.reply({ content: '<:13899754306013758771:1414619305445691473> Bu komutu sadece **Üst Yetkili** rolü kullanabilir!', ephemeral: true });
    }

    const target = interaction.options.getUser("kullanıcı");

    // cezalar.json'dan kontrol et
    let cezalar = [];
    if (fs.existsSync(CEZA_PATH)) {
      cezalar = JSON.parse(fs.readFileSync(CEZA_PATH, "utf8"));
    }
    const ceza = cezalar.find(c => c.user === target.id && c.type === "PERMA_BAN" && c.active);

    if (!ceza) {
      return interaction.reply({ content: "<:13899754306013758771:1414619305445691473> Bu kullanıcının kalıcı yasağı yok.", ephemeral: true });
    }

    // ✅ Ban kaldır
    await interaction.guild.members.unban(target.id).catch(() => null);

    // Ceza kaydını pasif yap
    ceza.active = false;
    fs.writeFileSync(CEZA_PATH, JSON.stringify(cezalar, null, 2));

    const now = Date.now();
    const unix = Math.floor(now / 1000);

    const embed = new EmbedBuilder()
      .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
      .setDescription(`${interaction.user} *tarafından bir kullanıcının kalıcı yasağı  başarıyla kaldırıldı.*\n\n**Ceza Türü:** \`PERMA UNBAN\`\n**Yasağı Kaldırılan:** ${target}\n**Yasağı Kaldıran:** ${interaction.user}\n\n**Tarih:** <t:${unix}:F> (<t:${unix}:R>)`)
      .setColor("#acdce4")
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter({ text: `${config.brandFooter.split(' | ')[0]} | Ceza Sistemi.`, iconURL: config.logo });

    await interaction.reply({ embeds: [embed] });
  }
};
