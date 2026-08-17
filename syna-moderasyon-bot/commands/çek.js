const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("çek")
    .setDescription("Bir kullanıcıyı kendi ses kanalınıza çeker.")
    .addUserOption(option =>
      option.setName("üye")
        .setDescription("Çekilecek üye")
        .setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("üye");
    const targetMember = interaction.options.getMember("üye");
    const authorMember = interaction.member;

    // Hedef kullanıcı bulunamadı
    if (!targetMember) {
      return interaction.reply({ 
        content: "Kullanıcı bulunamadı.", 
        ephemeral: true 
      });
    }

    // Komutu kullanan kişi ses kanalında değil
    if (!authorMember.voice.channel) {
      return interaction.reply({ 
        content: "Ses kanalında değilsiniz.", 
        ephemeral: true 
      });
    }

    // Hedef kullanıcı zaten aynı kanalda
    if (targetMember.voice.channel && targetMember.voice.channel.id === authorMember.voice.channel.id) {
      return interaction.reply({ 
        content: "Bu kullanıcı zaten sizin ses kanalınızda.", 
        ephemeral: true 
      });
    }

    try {
      // Kullanıcıyı ses kanalına çek
      await targetMember.voice.setChannel(authorMember.voice.channel);

      // Başarı embed'i - görseldeki gibi
      const embed = new EmbedBuilder()
        .setDescription("<:13899754320777749011:1413932765128425584> | **Başarıyla kullanıcıyı ses kanalınıza çektiniz!**")
        .setColor("#006400");

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error("Ses kanalına çekme hatası:", error);
      return interaction.reply({ 
        content: "Kullanıcıyı ses kanalına çekerken bir hata oluştu.", 
        ephemeral: true 
      });
    }
  }
};
