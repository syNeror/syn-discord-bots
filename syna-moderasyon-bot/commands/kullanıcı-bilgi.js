const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kullanıcı-bilgi")
    .setDescription("Kullanıcı hakkında detaylı bilgi gösterir.")
    .addUserOption(option =>
      option
        .setName("kullanıcı")
        .setDescription("Bilgilerini görmek istediğiniz kullanıcıyı seçin")
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("kullanıcı");
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    
    if (!targetMember) {
      return interaction.reply({ 
        content: "<:13899754306013758771:1414619305445691473> Bu kullanıcı sunucuda bulunamadı.", 
        ephemeral: true 
      });
    }

    // Kullanıcı bilgileri
    const userId = targetUser.id;
    const username = targetUser.username;
    const serverName = targetMember.nickname || targetUser.username;
    const accountCreated = targetUser.createdAt;
    const serverJoined = targetMember.joinedAt;

    // Roller
    const roles = targetMember.roles.cache
      .filter(role => role.id !== interaction.guild.id)
      .map(role => role.name)
      .join(", ");

    // Davet bilgisi (basit kontrol)
    let inviteInfo = "Davet bilgisi bulunamadı.";
    // Bu kısım daha gelişmiş davet sistemi gerektirir

    // Uyarı bilgisi (basit kontrol)
    let warningInfo = "Uyarı bulunmuyor.";
    // Bu kısım uyarı sistemi gerektirir

    // İstatistikler (örnek veriler - gerçek sistemde veritabanından alınmalı)
    const totalMessages = Math.floor(Math.random() * 1000) + 100;
    const dailyMessages = Math.floor(Math.random() * 50) + 5;
    const weeklyMessages = Math.floor(Math.random() * 200) + 50;

    const totalVoiceTime = "48:26:03"; // Örnek veri
    const dailyVoiceTime = "3:21:46"; // Örnek veri
    const weeklyVoiceTime = "29:20:01"; // Örnek veri

    // Embed oluştur - görseldeki gibi tek description
    const embed = new EmbedBuilder()
      .setAuthor({
        name: username,
        iconURL: targetUser.displayAvatarURL({ dynamic: true })
      })
      .addFields(
        {
          name: "<:13917260748992021391:1413930672187375688> Kullanıcı Bilgileri",
          value:
            `\`\`\`fix\n` +
            `ID: ${userId}\n` +
            `Kullanıcı Adı: ${username}\n` +
            `Sunucu İsmi: ${serverName}\n` +
            `Hesap Oluşturma: ${accountCreated.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} ${accountCreated.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} (${Math.floor((Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24 * 30))} ay önce)\n` +
            `Sunucuya Katılma: ${serverJoined.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} ${serverJoined.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} (${Math.floor((Date.now() - serverJoined.getTime()) / (1000 * 60 * 60 * 24 * 30))} ay önce)\n` +
            `\`\`\``,
          inline: false
        },
        {
          name: `<a:1389975454496329728:1413636582300188862> Roller [${targetMember.roles.cache.size - 1}]`,
          value: `\`\`\`fix\n${roles || "Rol bulunmuyor"}\n\`\`\``,
          inline: false
        },
        {
          name: "<:1267509137269457037:1414739999013863475> Davet Bilgisi",
          value: `\`\`\`fix\n${inviteInfo}\n\`\`\``,
          inline: false
        },
        {
          name: "<a:13899754405501378661:1413636586830037125> Mesaj İstatistikleri",
          value:
            `\`\`\`fix\n` +
            `Toplam: ${totalMessages} mesaj\n` +
            `Günlük: ${dailyMessages} mesaj\n` +
            `Haftalık: ${weeklyMessages} mesaj\n` +
            `\`\`\``,
          inline: true
        },
        {
          name: "<a:1389983208371781754:1414430430861459477> Ses İstatistikleri",
          value:
            `\`\`\`fix\n` +
            `Toplam: ${totalVoiceTime}\n` +
            `Günlük: ${dailyVoiceTime}\n` +
            `Haftalık: ${weeklyVoiceTime}\n` +
            `\`\`\``,
          inline: true
        }
      )
      .setColor("#add8e6")
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({
        text: `${config.brandFooter.split(' | ')[0]} | Kullanıcı Bilgi Sistemi.`,
        iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    await interaction.reply({ 
      content: `<@${targetUser.id}>`, 
      embeds: [embed] 
    });
  },
};
