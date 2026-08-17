const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require('../config.json');
const fs = require("fs");
const path = require("path");

const BLACKLIST_PATH = path.join(__dirname, "..", "blacklist.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("blacklist-affı")
    .setDescription("Tüm blacklist'leri temizler (affı)."),

  async execute(interaction) {
    // Yetki kontrolü
    if (!interaction.member.roles.cache.has(config.yetkiliRolId)) {
      return interaction.reply({ 
        content: 'Bu komutu kullanmak için yetkili rolüne sahip olmanız gerekiyor.', 
        ephemeral: true 
      });
    }

    // İlk embed - komut kullanıldı
    const firstEmbed = new EmbedBuilder()
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setDescription("> <a:alvardinlenme:1414737261098172426> Bütün blacklistler açılmaya başlandı.")
      .setColor("#add8e6")
      .setFooter({
        text: `${config.brandFooter.split(' | ')[0]} | Ceza Sistemi`,
        iconURL: config.logo
      });

    const message = await interaction.reply({ embeds: [firstEmbed] });

    // Blacklist dosyasını temizle
    const emptyBlacklist = { kullanıcılar: [] };
    fs.writeFileSync(BLACKLIST_PATH, JSON.stringify(emptyBlacklist, null, 2));

    // 2 saniye bekle
    await new Promise(resolve => setTimeout(resolve, 2000));

    // İkinci embed - affı tamamlandı
    const secondEmbed = new EmbedBuilder()
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setDescription("<:13899754320777749011:1413932765128425584> | **Blacklist affı tamamlandı.**")
      .setColor("#add8e6")
      .setFooter({
        text: `${config.brandFooter.split(' | ')[0]} | Ceza Sistemi`,
        iconURL: config.logo
      });

    // Mesajı güncelle
    await message.edit({ embeds: [secondEmbed] });
  }
};
