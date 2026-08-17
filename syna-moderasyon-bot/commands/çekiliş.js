const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("çekiliş")
    .setDescription("Çekiliş yönetim komutları."),

  async execute(interaction) {
    // Sadece üst yetkili rolü kullanabilir
    if (config.üstyetkiliRolID && !interaction.member.roles.cache.has(config.üstyetkiliRolID)) {
      return interaction.reply({ content: '<:13899754306013758771:1414619305445691473> Bu komutu sadece **Üst Yetkili** rolü kullanabilir!', ephemeral: true });
    }

    // 1. Görsel - Çekiliş İşlemleri embed'i
    const firstEmbed = new EmbedBuilder()
      .setTitle("🎁 Çekiliş İşlemleri")
      .setDescription("Aşağıdaki menüden bir çekiliş işlemi seçiniz!")
      .setColor("#add8e6")
      .setFooter({
        text: `${config.brandFooter.split(' | ')[0]} | Çekiliş Sistemi`,
        iconURL: config.logo
      });

    const selectMenu = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("çekiliş_menu")
          .setPlaceholder("Çekiliş İşlemini Seçiniz!")
          .addOptions([
            {
              label: "Çekiliş Başlat",
              description: "Yeni bir çekiliş başlatır.",
              value: "başlat",
              emoji: "<:1187135503515013160:1413345639550681089>"
            },
            {
              label: "Çekiliş Bitir",
              description: "Devam eden bir çekilişi bitirir.",
              value: "bitir",
              emoji: "<:1187139727908937809:1413345628016087121>"
            },
            {
              label: "Çekilişi Yeniden Çek",
              description: "Kazananları yeniden belirler.",
              value: "yeniden",
              emoji: "<:1187141486819688448:1413345682902880448>"
            }
          ])
      );

    await interaction.reply({ embeds: [firstEmbed], components: [selectMenu] });
  }
};
