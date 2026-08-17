const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
  } = require("discord.js");
  const config = require("../config.json");
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("ip")
      .setDescription("Sunucu IP adresini gösterir."),
    async execute(interaction) {
      try {
        const embed = new EmbedBuilder()
          .setColor("#2f3136")
          .setAuthor({
            name: interaction.member.displayName,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setDescription(`**Ip Adresimiz:**\n\`\`\`fix\n${config.ip}\n\`\`\``)
          .addFields(
            { name: "TS3", value: "\`Voice Chat\`", inline: true },
            { name: "YurtD", value: "\`Voice Chat\`", inline: true }
          )
          .setThumbnail(config.serverLogo || interaction.guild.iconURL({ dynamic: true }))
          .setFooter({ text: "Synatx Bot's | Bilgi Sistemi." });
  
        // Buton
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("Sunucuya Bağlan")
            .setStyle(ButtonStyle.Link)
            .setURL(`https://discord.gg/seabots`)
        );
  
        await interaction.reply({ embeds: [embed], components: [row] });
      } catch (err) {
        console.error("/ip hata:", err);
        await interaction.reply({
          content: "⚠️ IP bilgisi gösterilemedi.",
          ephemeral: true
        });
      }
    },
  };
  