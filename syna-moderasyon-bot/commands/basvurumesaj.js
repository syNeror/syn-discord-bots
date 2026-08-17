const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("basvurumesaj")
    .setDescription("Yetkili başvuru mesajını gönderir."),
  async execute(interaction) {
    const embed = new EmbedBuilder()
  .setAuthor({ 
    name: `${interaction.guild.name}`, 
    iconURL: interaction.guild.iconURL({ dynamic: true }) 
  })
      .setDescription(
        "\`\`\`    ឵឵              YETKİLİ BAŞVURU METINI \`\`\`\n" +
        "Sunucumuzda Yetkili Olmak İçin Başvuru Formunu Doldurmanız Gerekmektedir.\n\n" +
        "Başvuru formunu görmek için aşağıdaki buttona bas.\n\n" +
        "Troll başvurular okunmadan reddedilir.\n\n"
      )
      .setColor("#acdce4");

    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("yetkili_basvuru")
        .setLabel("Yetkili Başvurusu")
        .setEmoji("<:1249678270862069780:1408509202594398218>")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [button] });
  }
};
