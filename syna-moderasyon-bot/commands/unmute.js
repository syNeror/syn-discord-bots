const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require('../config.json');
const fs = require("fs");
const path = require("path");

const CEZA_PATH = path.join(__dirname, "..", "cezalar.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Bir kullanıcının susturmasını kaldırır.")
    .addUserOption(option =>
      option.setName("kullanıcı").setDescription("Susturması kaldırılacak kullanıcı").setRequired(true)
    ),

  async execute(interaction, client) {
    // Sadece üst yetkili rolü kullanabilir
    if (config.üstyetkiliRolID && !interaction.member.roles.cache.has(config.üstyetkiliRolID)) {
      return interaction.reply({ content: '<:13899754306013758771:1414619305445691473> Bu komutu sadece **Üst Yetkili** rolü kullanabilir!', ephemeral: true });
    }

    const target = interaction.options.getUser("kullanıcı");
    const member = await interaction.guild.members.fetch(target.id);

    // Susturma rolünü bul
    let muteRole = interaction.guild.roles.cache.find(r => r.name === "Muted");
    if (!muteRole) {
      return interaction.reply({ content: "<:13899754306013758771:1414619305445691473> Susturma rolü bulunamadı.", ephemeral: true });
    }

    // Eğer üyede mute rolü yoSta
    if (!member.roles.cache.has(muteRole.id)) {
      return interaction.reply({ content: "<:13899754306013758771:1414619305445691473> Bu kullanıcı zaten susturulmamış.", ephemeral: true });
    }

    // ✅ Rolü kaldır
    await member.roles.remove(muteRole, `Susturmayı kaldıran: ${interaction.user.tag}`);

    // Ceza kaydına işleyelim
    let cezalar = [];
    if (fs.existsSync(CEZA_PATH)) {
      cezalar = JSON.parse(fs.readFileSync(CEZA_PATH, "utf8"));
    }
    const cezaId = cezalar.length + 1;
    cezalar.push({ id: cezaId, user: target.id, type: "UNMUTE", staff: interaction.user.id });
    fs.writeFileSync(CEZA_PATH, JSON.stringify(cezalar, null, 2));

    const unix = Math.floor(Date.now() / 1000);

    // ✅ Embed
    const embed = new EmbedBuilder()
      .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
      .setDescription(`${interaction.user} tarafından bir kişinin sunucuda <t:${unix}:R> susturması başarıyla kaldırıldı. \n\n**Susturması Kaldırılan:** \`${target}\`\n**Susturmayı Kaldıran:** \`${interaction.user}\``)
      .setColor("#2f3136")
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ text: `${config.brandFooter.split(' | ')[0]} | Ceza Sistemi.`, iconURL: config.logo });

    await interaction.reply({ embeds: [embed] });
  }
};
