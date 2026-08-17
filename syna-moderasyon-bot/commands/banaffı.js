const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("banaffı")
    .setDescription("Sunucudaki tüm yasaklı kullanıcıların banını kaldırır.")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers), // ✅ sadece yetkililer kullanabilir

  async execute(interaction) {
    // Kullanıcıda BanMembers yetkisi yoSta
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({
        content: "<:13899754306013758771:1414619305445691473> Bu komutu kullanmak için **Üyeleri Yasakla** yetkisine sahip olmalısın.",
        ephemeral: true,
      });
    }

    try {
      await interaction.deferReply({ ephemeral: false });

      const bans = await interaction.guild.bans.fetch();
      if (!bans.size) {
        return interaction.editReply("<:13899754306013758771:1414619305445691473> Sunucuda kaldırılacak ban bulunamadı.");
      }

      let success = 0;
      let failed = 0;

      for (const [userId] of bans) {
        try {
          await interaction.guild.bans.remove(userId, `Ban affı: ${interaction.user.tag}`);
          success++;
        } catch (err) {
          console.error(`Ban kaldırılamadı: ${userId}`, err);
          failed++;
        }
      }

      const embed = new EmbedBuilder()
        .setColor("#2f3136")
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
        .setDescription(
          `<:1149250145154781287:1413343677258006569> ${interaction.user} tarafından **ban affı** uygulandı.\n\n` +
          `<:13899754320777749011:1413932765128425584> Kaldırılan Ban: **${success}**\n` +
          `<a:1389982026706190336:1413930653321531563> Başarısız: **${failed}**`
        )
        .setFooter({ text: "Synatx Bot's | Ceza Sistemi." })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error("/banaffı hata:", err);
      await interaction.editReply("⚠️ Ban affı uygulanırken bir hata oluştu.");
    }
  },
};
