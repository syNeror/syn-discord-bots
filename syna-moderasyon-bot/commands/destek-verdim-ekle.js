const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const logConfig = require("../log.json");

const DESTEK_PATH = path.join(__dirname, "..", "destek.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("destek-verdim-ekle")
    .setDescription("Destek kaydı oluşturur.")
    .addStringOption(option =>
      option.setName("şikayet-edilenler")
        .setDescription("Şikayet edilen kullanıcılar")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("şikayet-edenler")
        .setDescription("Şikayet eden kullanıcılar")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("sebep")
        .setDescription("Şikayet sebebi")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("sonuç")
        .setDescription("Sonuç")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("yardım-eden-yetkili")
        .setDescription("Yardım eden yetkili")
        .setRequired(true)
    ),

  async execute(interaction) {
    const şikayetEdilenler = interaction.options.getString("şikayet-edilenler");
    const şikayetEdenler = interaction.options.getString("şikayet-edenler");
    const sebep = interaction.options.getString("sebep");
    const sonuç = interaction.options.getString("sonuç");
    const yardımEdenYetkili = interaction.options.getString("yardım-eden-yetkili");

    // Destek ID oluştur
    const destekId = Math.floor(Math.random() * 10000000000);
    const tarih = new Date().toLocaleString("tr-TR");

    // Destek verilerini kaydet
    let destekler = {};
    if (fs.existsSync(DESTEK_PATH)) {
      destekler = JSON.parse(fs.readFileSync(DESTEK_PATH, "utf8"));
    }

    const destekKaydı = {
      id: destekId,
      şikayetEdilenler,
      şikayetEdenler,
      sebep,
      sonuç,
      yardımEdenYetkili,
      tarih,
      oluşturan: interaction.user.id
    };

    destekler[destekId] = destekKaydı;
    fs.writeFileSync(DESTEK_PATH, JSON.stringify(destekler, null, 2));

    // 1. Görsel - Destek Kaydı embed'i
    const embed = new EmbedBuilder()
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setTitle(`Destek Kaydı ${tarih}`)
      .setColor("#add8e6")
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: "🖥️ Destek Veren",
          value: yardımEdenYetkili,
          inline: false
        },
        {
          name: "🚫 Şikayet Edilenler",
          value: şikayetEdilenler,
          inline: false
        },
        {
          name: "👤 Şikayet Edenler",
          value: şikayetEdenler,
          inline: false
        },
        {
          name: "⚠️ Şikayet Sebebi",
          value: sebep,
          inline: false
        },
        {
          name: "🚫 Sonuç",
          value: sonuç,
          inline: false
        }
      )
      .setFooter({
        text: `Destek ID: ${destekId} • ${tarih}`,
        iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
      });

    await interaction.reply({ embeds: [embed] });

    // Log kanalına gönder - 3. Görsel
    const logChannel = interaction.guild.channels.cache.get(logConfig["Stticket-yetkili-log"]);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setTitle("Destek Kaydı Oluşturuldu")
        .setColor("#00ff00")
        .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          {
            name: "🖥️ Destek Veren",
            value: yardımEdenYetkili,
            inline: false
          },
          {
            name: "🚫 Şikayet Edilenler",
            value: şikayetEdilenler,
            inline: false
          },
          {
            name: "👤 Şikayet Edenler",
            value: şikayetEdenler,
            inline: false
          },
          {
            name: "⚠️ Şikayet Sebebi",
            value: sebep,
            inline: false
          },
          {
            name: "🚫 Sonuç",
            value: sonuç,
            inline: false
          }
        )
        .setFooter({
          text: `Destek ID: ${destekId} • ${tarih}`,
          iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
        });

      await logChannel.send({ embeds: [logEmbed] });
    }
  }
};
