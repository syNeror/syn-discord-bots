// commands/unban.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const config = require('../config.json');
const fs = require("fs");
const path = require("path");

const CEZA_PATH = path.join(__dirname, "..", "cezalar.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Kişinin yasağını kaldırır.")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(opt =>
      opt.setName("kullanıcı")
        .setDescription("Yasağı kaldırılacak kullanıcı")
        .setRequired(true)
    ),

  async execute(interaction) {
    // Sadece üst yetkili rolü kullanabilir
    if (config.üstyetkiliRolID && !interaction.member.roles.cache.has(config.üstyetkiliRolID)) {
      return interaction.reply({ content: '<:13899754306013758771:1414619305445691473> Bu komutu sadece **Üst Yetkili** rolü kullanabilir!', ephemeral: true });
    }

    const targetUser = interaction.options.getUser("kullanıcı", true);

    // Yetki kontrolleri
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: "<:13899754306013758771:1414619305445691473> Bu komutu kullanmak için **Üyeleri Yasakla** iznine ihtiyacın var.", ephemeral: true });
    }
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: "<:13899754306013758771:1414619305445691473> Benim **Üyeleri Yasakla** iznim yok.", ephemeral: true });
    }

    // 📌 PERMA BAN kontrolü
    let cezalar = [];
    if (fs.existsSync(CEZA_PATH)) {
      cezalar = JSON.parse(fs.readFileSync(CEZA_PATH, "utf8"));
    }
    const aktifPermaBan = cezalar.find(c => c.user === targetUser.id && c.type === "PERMA_BAN" && c.active);

    if (aktifPermaBan) {
      return interaction.reply({
        content: "<:13899754306013758771:1414619305445691473> Bu kullanıcının yasaklanması **kalıcı** olduğu için bu yasaklamayı açamazsınız.",
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: false }); // Herkes görecek

    // unban işlemi
    await interaction.guild.bans.remove(targetUser.id).catch(err => {
      throw new Error(`Unban işlemi başarısız: ${err.message}`);
    });

    const now = Math.floor(Date.now() / 1000);

    // ✅ Embed
    const replyEmbed = new EmbedBuilder()
      .setAuthor({ name: `${interaction.user.username}.`, iconURL: interaction.user.displayAvatarURL({ size: 256 }) })
.setDescription(`${interaction.user} tarafından bir kişinin sunucuda <t:${now}:R> yasağı kaldırıldı. \n\n **Ceza Türü** \`UNBAN\` \n **Yasağı Kaldırılan:** ${targetUser} \n **Yasağı Kaldıran:** ${interaction.user}`)
      .setThumbnail(interaction.guild.iconURL({ size: 256 }) || null)
      .setColor("#046404")
      .setFooter({ text: `${config.brandFooter.split(' | ')[0]} | Ceza Sistemi.`, iconURL: config.logo });

    await interaction.editReply({ embeds: [replyEmbed] });
  }
};
