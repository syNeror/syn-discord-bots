const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { getUserData } = require("../services/warnService");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("uyari-bak")
    .setDescription("Kullanıcının uyarılarını göster")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(o => o.setName("kullanıcı").setDescription("Bakılacak kişi").setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser("kullanıcı", true);
    const data = await getUserData(interaction.guildId, user.id);

    const embed = new EmbedBuilder()
      .setTitle("Uyarı Durumu")
      .setDescription(`<@${user.id}> kullanıcısının kayıtları`)
      .addFields(
        { name: "Mevcut Uyarı", value: `${data.count}`, inline: true },
        { name: "Toplam Verilen", value: `${data.total}`, inline: true },
        { name: "Son Azaltma", value: new Date(data.lastDecay).toLocaleString(), inline: false },
      )
      .setColor(0x5865f2);

    return interaction.reply({ embeds: [embed], ephemeral: false });
  }
};
