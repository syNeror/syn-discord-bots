const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  PermissionFlagsBits 
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("../config.json");
const logConfig = require("../log.json");

const BLACKLIST_PATH = path.join(__dirname, "..", "blacklist.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("blacklist")
    .setDescription("Blacklist yönetim komutları.")
    .addSubcommand(sub =>
      sub
        .setName("ekle")
        .setDescription("Bir kullanıcıyı blacklist'e ekler.")
        .addUserOption(option =>
          option.setName("üye")
            .setDescription("Blacklist'e eklenecek üye")
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName("sebep")
            .setDescription("Blacklist sebebi")
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("çıkar")
        .setDescription("Bir kullanıcıyı blacklist'ten çıkarır.")
        .addUserOption(option =>
          option.setName("üye")
            .setDescription("Blacklist'ten çıkarılacak üye")
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("bilgi")
        .setDescription("Bir kullanıcının blacklist bilgilerini gösterir.")
        .addUserOption(option =>
          option.setName("üye")
            .setDescription("Bilgisi alınacak üye")
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("liste")
        .setDescription("Blacklist'teki kullanıcıları listeler.")
    )
    .addSubcommand(sub =>
      sub
        .setName("kontrol")
        .setDescription("Bir kullanıcının blacklist'te olup olmadığını kontrol eder.")
        .addUserOption(option =>
          option.setName("üye")
            .setDescription("Kontrol edilecek üye")
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // Yetki kontrolü
    if (!interaction.member.roles.cache.has(config.yetkiliRolId)) {
      return interaction.reply({ 
        content: 'Bu komutu kullanmak için yetkili rolüne sahip olmanız gerekiyor.', 
        ephemeral: true 
      });
    }

    /* --------- BLACKLIST EKLE --------- */
    if (sub === "ekle") {
      const target = interaction.options.getUser("üye");
      const reason = interaction.options.getString("sebep");

      // Blacklist dosyasını oku veya oluştur
      let blacklist = { kullanıcılar: [] };
      if (fs.existsSync(BLACKLIST_PATH)) {
        blacklist = JSON.parse(fs.readFileSync(BLACKLIST_PATH, "utf8"));
      }

      // Kullanıcı zaten blacklist'te mi kontrol et
      const existingUser = blacklist.kullanıcılar.find(user => user.id === target.id);
      if (existingUser) {
        const errorEmbed = new EmbedBuilder()
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
          })
          .setDescription(`<:1389975434665525298:1413932211538886847> | <@${target.id}> zaten blacklist'te!`)
          .setColor("#ff0000")
          .setFooter({
            text: "Synatx",
            iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
          });
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      // Kullanıcıyı blacklist'e ekle
      const newUser = {
        id: target.id,
        sebep: reason,
        tarih: new Date().toLocaleString("tr-TR")
      };
      blacklist.kullanıcılar.push(newUser);
      fs.writeFileSync(BLACKLIST_PATH, JSON.stringify(blacklist, null, 2));

      // Başarı mesajı - görseldeki gibi
      const embed = new EmbedBuilder()
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setDescription(
          `> <:1389975434665525298:1413932211538886847> <@${target.id}> kişisi karalisteye eklendi.\n\n` +
          `<a:1389975446560440482:1413636566185807963> **Ekleyen:** <@${interaction.user.id}>\n` +
          `<:13917260748992021391:1413930672187375688> **Eklenen:** <@${target.id}>\n` +
          `<a:1389982026706190336:1413930653321531563> **Sebep:**\n\`\`\`fix\n${reason}\n\`\`\``
        )
        .setColor("#006400")
        .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
        .setFooter({
          text: "Synatx Bot's | Ceza Sistemi",
          iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
        });

      await interaction.reply({ embeds: [embed], ephemeral: true });

      // Log kanalına gönder
      const logChannel = interaction.guild.channels.cache.get(logConfig["Stblacklist-log"]);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
          })
          .setDescription(
            `> <:1389975434665525298:1413932211538886847> <@${target.id}> kişisi karalisteye eklendi.\n\n` +
            `<a:1389975446560440482:1413636566185807963> **Ekleyen:** <@${interaction.user.id}>\n` +
            `<:13917260748992021391:1413930672187375688> **Eklenen:** <@${target.id}>\n` +
            `<a:1389982026706190336:1413930653321531563> **Sebep:**\n\`\`\`fix\n${reason}\n\`\`\``
          )
          .setColor("#006400")
          .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
          .setFooter({
            text: "Synatx Bot's | Ceza Sistemi",
            iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
          });

        await logChannel.send({ embeds: [logEmbed] });
      }
    }

    /* --------- BLACKLIST ÇIKAR --------- */
    if (sub === "çıkar") {
      const target = interaction.options.getUser("üye");

      // Blacklist dosyasını oku
      let blacklist = { kullanıcılar: [] };
      if (fs.existsSync(BLACKLIST_PATH)) {
        blacklist = JSON.parse(fs.readFileSync(BLACKLIST_PATH, "utf8"));
      }

      // Kullanıcı blacklist'te mi kontrol et
      const existingUser = blacklist.kullanıcılar.find(user => user.id === target.id);
      if (!existingUser) {
        const errorEmbed = new EmbedBuilder()
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
          })
          .setDescription(`<:1389975434665525298:1413932211538886847> | <@${target.id}> blacklist'te değil!`)
          .setColor("#ff0000")
          .setFooter({
            text: "Synatx",
            iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
          });
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      // Kullanıcıyı blacklist'ten çıkar
      blacklist.kullanıcılar = blacklist.kullanıcılar.filter(user => user.id !== target.id);
      fs.writeFileSync(BLACKLIST_PATH, JSON.stringify(blacklist, null, 2));

      // Başarı mesajı - görseldeki gibi
      const embed = new EmbedBuilder()
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setDescription(
          `> <:1389975434665525298:1413932211538886847> <@${target.id}> kişisi karalisteden çıkartıldı.\n\n` +
          `<a:1389975446560440482:1413636566185807963> **Çıkaran:** <@${interaction.user.id}>\n` +
          `<:13917260748992021391:1413930672187375688> **Çıkartılan:** <@${target.id}>\n` +
          `<a:1389975454496329728:1413636582300188862> **Tarih:** ${new Date().toLocaleString("tr-TR")}`
        )
        .setColor("#660000")
        .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
        .setFooter({
          text: "Synatx Bot's | Ceza Sistemi",
          iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
        });

      await interaction.reply({ embeds: [embed], ephemeral: true });

      // Log kanalına gönder
      const logChannel = interaction.guild.channels.cache.get(logConfig["Stblacklist-log"]);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
          })
          .setDescription(
            `> <:1389975434665525298:1413932211538886847> <@${target.id}> kişisi karalisteden çıkartıldı.\n\n` +
            `<a:1389975446560440482:1413636566185807963> **Çıkaran:** <@${interaction.user.id}>\n` +
            `<:13917260748992021391:1413930672187375688> **Çıkartılan:** <@${target.id}>\n` +
            `<a:1389975454496329728:1413636582300188862> **Tarih:** ${new Date().toLocaleString("tr-TR")}`
          )
          .setColor("#660000")
          .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
          .setFooter({
            text: "Synatx Bot's | Ceza Sistemi",
            iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
          });

        await logChannel.send({ embeds: [logEmbed] });
      }
    }

    /* --------- BLACKLIST BİLGİ --------- */
    if (sub === "bilgi") {
      const target = interaction.options.getUser("üye");

      // Blacklist dosyasını oku
      let blacklist = { kullanıcılar: [] };
      if (fs.existsSync(BLACKLIST_PATH)) {
        blacklist = JSON.parse(fs.readFileSync(BLACKLIST_PATH, "utf8"));
      }

      // Kullanıcı blacklist'te mi kontrol et
      const userData = blacklist.kullanıcılar.find(user => user.id === target.id);

      if (!userData) {
        const errorEmbed = new EmbedBuilder()
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
          })
          .setDescription(`<:1389975434665525298:1413932211538886847> | <@${target.id}> blacklist'te değil!`)
          .setColor("#ff0000")
          .setFooter({
            text: "Synatx",
            iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
          });
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      // Blacklist bilgisi embed - görseldeki gibi
      const embed = new EmbedBuilder()
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setDescription(
          `> <:1389975434665525298:1413932211538886847> <@${target.id}> kişisinin karalisteye alınma nedeni aşağıda belirtilmiştir.\n\n` +
          `<:13917260748992021391:1413930672187375688> **Kişi:** <@${target.id}>\n` +
          `<a:1389982026706190336:1413930653321531563> **Sebep:** ${userData.sebep}\n` +
          `<a:1389975454496329728:1413636582300188862> **Tarih:** ${userData.tarih}`
        )
        .setColor("#add8e6")
        .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
        .setFooter({
          text: "Synatx Bot's | Ceza Sistemi",
          iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
        });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    /* --------- BLACKLIST LİSTE --------- */
    if (sub === "liste") {
      // Blacklist dosyasını oku
      let blacklist = { kullanıcılar: [] };
      if (fs.existsSync(BLACKLIST_PATH)) {
        blacklist = JSON.parse(fs.readFileSync(BLACKLIST_PATH, "utf8"));
      }

      if (blacklist.kullanıcılar.length === 0) {
        const embed = new EmbedBuilder()
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
          })
          .setDescription("> <:1389975434665525298:1413932211538886847> Blacklist'te kimse yok.")
          .setColor("#add8e6")
          .setFooter({
            text: "Synatx Bot's | Ceza Sistemi",
            iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
          })
          .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }));

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Blacklist verilerini al
      const blacklistData = [];
      for (const userData of blacklist.kullanıcılar) {
        try {
          const user = await Promise.race([
            interaction.client.users.fetch(userData.id),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
          ]);
          blacklistData.push({
            user: user,
            id: userData.id,
            sebep: userData.sebep,
            tarih: userData.tarih
          });
        } catch (err) {
          blacklistData.push({
            user: null,
            id: userData.id,
            sebep: userData.sebep,
            tarih: userData.tarih
          });
        }
      }

      // Embed oluştur - görseldeki gibi
      const embed = new EmbedBuilder()
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setDescription("> <:1389975434665525298:1413932211538886847> Blacklist listesi aşağıda belirtilmiştir.")
        .setColor("#add8e6")
        .setFooter({
          text: "Synatx Bot's | Ceza Sistemi",
          iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
        })
        .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }));

      // Her blacklist kullanıcısı için field ekle
      blacklistData.forEach((data, index) => {
        if (data.user) {
          embed.addFields({
            name: `${data.user.username}`,
            value: `<@${data.id}> (ID: ${data.id}): ${data.sebep}`,
            inline: false
          });
        } else {
          embed.addFields({
            name: `Bilinmeyen Kullanıcı`,
            value: `<@${data.id}> (ID: ${data.id}): ${data.sebep}`,
            inline: false
          });
        }
      });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    /* --------- BLACKLIST KONTROL --------- */
    if (sub === "kontrol") {
      const target = interaction.options.getUser("üye");

      // Blacklist dosyasını oku
      let blacklist = { kullanıcılar: [] };
      if (fs.existsSync(BLACKLIST_PATH)) {
        blacklist = JSON.parse(fs.readFileSync(BLACKLIST_PATH, "utf8"));
      }

      const userData = blacklist.kullanıcılar.find(user => user.id === target.id);

      const embed = new EmbedBuilder()
        .setColor(userData ? "#ff0000" : "#00ff00")
        .setTitle(`<:1389975434665525298:1413932211538886847> Blacklist Kontrolü`)
        .setDescription(
          `**${target.tag}** (${target.id}) kullanıcısının blacklist durumu:\n\n` +
          `${userData ? "🚫 **Blacklist'te bulunuyor**" : "✅ **Blacklist'te değil**"}`
        )
        .addFields(
          { 
            name: "<:13917260748992021391:1413930672187375688> Kullanıcı", 
            value: `${target.tag} (${target.id})`, 
            inline: true 
          },
          { 
            name: "📊 Durum", 
            value: userData ? "🚫 Blacklist'te" : "✅ Temiz", 
            inline: true 
          },
          { 
            name: "<a:1389975446560440482:1413636566185807963> Kontrol Eden", 
            value: `${interaction.user.tag}`, 
            inline: true 
          }
        )
        .setThumbnail(target.displayAvatarURL({ size: 256 }))
        .setTimestamp()
        .setFooter({ text: `${config.brandFooter.split(' | ')[0]} | Blacklist Sistemi`, iconURL: config.logo });

      await interaction.reply({ embeds: [embed] });
    }
  }
};
