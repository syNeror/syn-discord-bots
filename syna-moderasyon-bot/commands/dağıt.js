const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dağıt")
    .setDescription("Ses kanalındaki kullanıcıları kategorideki diğer ses kanallarına dağıtır.")
    .addChannelOption(option =>
      option.setName("kategori")
        .setDescription("Ses odası içeren bir kategori seçiniz.")
        .setRequired(true)
    ),

  async execute(interaction) {
    // Sadece üst yetkili rolü kullanabilir
    if (config.üstyetkiliRolID && !interaction.member.roles.cache.has(config.üstyetkiliRolID)) {
      return interaction.reply({ content: '<:13899754306013758771:1414619305445691473> Bu komutu sadece **Üst Yetkili** rolü kullanabilir!', ephemeral: true });
    }

    const kategori = interaction.options.getChannel("kategori");
    const kullanıcı = interaction.member;

    // Kategori kontrolü
    if (kategori.type !== 4) { // 4 = GUILD_CATEGORY
      return interaction.reply({ 
        content: "Lütfen geçerli bir kategori seçiniz.", 
        ephemeral: true 
      });
    }

    // Kullanıcı ses kanalında mı kontrol et
    if (!kullanıcı.voice.channel) {
      return interaction.reply({ 
        content: "Ses kanalında değilsiniz.", 
        ephemeral: true 
      });
    }

    // Kategori içindeki ses kanallarını bul
    const sesKanalları = kategori.children.cache.filter(channel => channel.type === 2); // 2 = GUILD_VOICE
    
    if (sesKanalları.size === 0) {
      return interaction.reply({ 
        content: "Bu kategoride ses kanalı bulunamadı.", 
        ephemeral: true 
      });
    }

    // Mevcut ses kanalındaki kullanıcıları al
    const mevcutKanal = kullanıcı.voice.channel;
    const kullanıcılar = mevcutKanal.members.filter(member => !member.user.bot);

    if (kullanıcılar.size === 0) {
      return interaction.reply({ 
        content: "Ses kanalında dağıtılacak kullanıcı bulunamadı.", 
        ephemeral: true 
      });
    }

    // Kullanıcıları ses kanallarına dağıt
    const kullanıcıArray = Array.from(kullanıcılar.values());
    const kanalArray = Array.from(sesKanalları.values());
    
    let dağıtılanKullanıcılar = 0;
    const hatalar = [];

    for (let i = 0; i < kullanıcıArray.length; i++) {
      const kullanıcı = kullanıcıArray[i];
      const hedefKanal = kanalArray[i % kanalArray.length]; // Döngüsel dağıtım
      
      try {
        await kullanıcı.voice.setChannel(hedefKanal);
        dağıtılanKullanıcılar++;
      } catch (error) {
        hatalar.push(`${kullanıcı.user.tag}: ${error.message}`);
      }
    }

    // Sonuç embed'i - karışık güzel tarz
    const embed = new EmbedBuilder()
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setDescription(
        `> <:13899754320777749011:1413932765128425584> **Dağıtım işlemi başarıyla tamamlandı!**\n\n` +
        `📁 **Kategori:** ${kategori.name}\n` +
        `🎤 **Kaynak Kanal:** ${mevcutKanal.name}\n` +
        `👥 **Dağıtılan Kullanıcı:** ${dağıtılanKullanıcılar}/${kullanıcıArray.length}\n` +
        `🎯 **Hedef Kanallar:** ${kanalArray.length} kanal`
      )
      .setColor("#add8e6")
      .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
      .setFooter({
        text: `${config.brandFooter.split(' | ')[0]} | Ses Sistemi`,
        iconURL: config.logo
      });

    if (hatalar.length > 0) {
      embed.addFields({
        name: "⚠️ Hatalar",
        value: hatalar.slice(0, 5).join("\n") + (hatalar.length > 5 ? `\n... ve ${hatalar.length - 5} hata daha` : ""),
        inline: false
      });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
