const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const config = require("../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("allmute")
    .setDescription("Bulunduğun ses kanalındaki herkesi susturur veya susturmayı kaldırır.")
    .addStringOption(opt =>
      opt.setName("işlem")
        .setDescription("Ne yapılacak?")
        .setRequired(true)
        .addChoices(
          { name: "Sustur", value: "mute" },
          { name: "Susturmayı Aç", value: "unmute" }
        )
    ),

  async execute(interaction) {
    const member = interaction.member;

    if (!member.roles.cache.has(config.yetkiliRolId)) {
      return interaction.reply({ content: "<:13899754306013758771:1414619305445691473> Bu komutu sadece yetkili rolü kullanabilir.", ephemeral: true });
    }

    if (!member.voice.channel) {
      return interaction.reply({ content: "<:13899754306013758771:1414619305445691473> Bir ses kanalında olmalısın.", ephemeral: true });
    }

    const işlem = interaction.options.getString("işlem");
    const kanal = member.voice.channel;

    kanal.members.forEach(m => {
      if (işlem === "mute") {
        m.voice.setMute(true, "Toplu susturma");
      } else {
        m.voice.setMute(false, "Toplu susturma kaldırma");
      }
    });

    const embed = new EmbedBuilder()
      .setColor("#2b2d31")
      .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL() })
      .setDescription(
        `<a:1389982023455740078:1414430427145310348> **İşlem:** ${işlem === "mute" ? "Herkes Susturuldu" : "Susturmalar Açıldı"}\n` +
        `<a:1390024057340039271:1413894433467797645> **Kanal:** ${kanal}`
      )
      .setFooter({ text: "Synatx Bot's | AllMute Sistemi." });

    await interaction.reply({ embeds: [embed] });
  }
};
