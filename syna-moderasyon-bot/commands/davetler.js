const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require('../config.json');
const fs = require("fs");
const path = require("path");

const DAVETLER_PATH = path.join(__dirname, "..", "davetler.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("davetler")
    .setDescription("Kullanıcının davet bilgilerini gösterir.")
    .addUserOption(option =>
      option.setName("kullanıcı")
        .setDescription("Davet bilgilerini görmek istediğiniz kullanıcı")
        .setRequired(false)
    ),

  async execute(interaction) {
    // Davetler dosyasını oku
    let davetler = {};
    if (fs.existsSync(DAVETLER_PATH)) {
      davetler = JSON.parse(fs.readFileSync(DAVETLER_PATH, "utf8"));
    }

    // Hedef kullanıcıyı belirle
    const targetUser = interaction.options.getUser("kullanıcı") || interaction.user;
    const userId = targetUser.id;
    const userData = davetler[userId] || {
      toplam: 0,
      ayrılanlar: 0,
      davetEttikleri: [],
      ayrılanlar: []
    };

    // Davet bilgileri embed'i - görseldeki gibi
    const embed = new EmbedBuilder()
      .setAuthor({
        name: targetUser.username,
        iconURL: targetUser.displayAvatarURL({ dynamic: true })
      })
      .setTitle("Davet Bilgileri")
      .setColor("#add8e6")
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: "> <:13917260748992021391:1413930672187375688> Toplam Davet Bilgileri",
          value: `\`\`\`diff\n+ Toplam: ${userData.toplam}\n- Ayrılanlar: ${userData.ayrılanlar}\n# Aktif: ${userData.toplam - userData.ayrılanlar}\`\`\``,
          inline: false
        },
        {
          name: "> <a:alvardinlenme:1414737261098172426> Davet Ettiği Kişiler",
          value: userData.davetEttikleri.length > 0 
            ? userData.davetEttikleri.map(user => `[+] <@${user.id}> - ${user.tarih}`).join("\n")
            : "Henüz kimse davet edilmemiş",
          inline: false
        },
        {
          name: "> <:1389975434665525298:1413932211538886847> Ayrılan Kişiler",
          value: userData.ayrılanlar.length > 0
            ? userData.ayrılanlar.map(user => `[-] <@${user.id}> - ${user.tarih}`).join("\n")
            : "Henüz kimse ayrılmamış",
          inline: false
        }
      )
      .setFooter({
        text: `${config.brandFooter.split(' | ')[0]} | Davet Sistemi`,
        iconURL: config.logo
      });

    await interaction.reply({ embeds: [embed] });
  }
};
