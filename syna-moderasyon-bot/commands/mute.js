const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const config = require('../config.json');
const fs = require("fs");
const path = require("path");

const CEZA_PATH = path.join(__dirname, "..", "cezalar.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Bir kullanıcıyı susturur.")
    .addUserOption(option =>
      option.setName("kullanıcı").setDescription("Susturulacak kullanıcı").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("sebep").setDescription("Susturma sebebi").setRequired(true)
    ),

  async execute(interaction, client) {
    // Sadece üst yetkili rolü kullanabilir
    if (config.üstyetkiliRolID && !interaction.member.roles.cache.has(config.üstyetkiliRolID)) {
      return interaction.reply({ content: '<:13899754306013758771:1414619305445691473> Bu komutu sadece **Üst Yetkili** rolü kullanabilir!', ephemeral: true });
    }

    const target = interaction.options.getUser("kullanıcı");
    const reason = interaction.options.getString("sebep");
    const member = await interaction.guild.members.fetch(target.id);

    // ✅ Muted rolünü al / oluştur
    let muteRole = interaction.guild.roles.cache.find(r => r.name === "Muted");
    if (!muteRole) {
      muteRole = await interaction.guild.roles.create({
        name: "Muted",
        color: "#2f3136",
        reason: "Susturma rolü otomatik oluşturuldu"
      });

      // Kanallarda yazmayı engelle
      for (const [, channel] of interaction.guild.channels.cache) {
        await channel.permissionOverwrites.edit(muteRole, {
          SendMessages: false,
          Speak: false,
          AddReactions: false
        }).catch(() => {});
      }
    }

    // ✅ Rol ver
    await member.roles.add(muteRole, `Mute sebebi: ${reason}`);

    // Ceza ID
    let cezalar = [];
    if (fs.existsSync(CEZA_PATH)) {
      cezalar = JSON.parse(fs.readFileSync(CEZA_PATH, "utf8"));
    }
    const cezaId = cezalar.length + 1;
    cezalar.push({ id: cezaId, user: target.id, type: "MUTE", reason, staff: interaction.user.id });
    fs.writeFileSync(CEZA_PATH, JSON.stringify(cezalar, null, 2));

        const unix = Math.floor(Date.now() / 1000);

    // ✅ Embed
    const embed = new EmbedBuilder()
      .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
      .setDescription(`${interaction.user} tarafından bir kişi sunucuda <t:${unix}:R> susturuldu. \n**Ceza ID** \`#${cezaId}\` \n **Ceza Türü** \`MUTE\` \n**Susturulan** \`${target}\` \n**Susturan** \`${interaction.user}\` \n**Sebep** \`${reason}\``)
      .setColor("#2f3136")
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ text: `${config.brandFooter.split(' | ')[0]} | Ceza Sistemi.`, iconURL: config.logo });

    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`mute_kaldir_${target.id}_${cezaId}`)
        .setLabel("Susturmayı Kaldır")
        .setEmoji("<:cokutusu:1416571451007307807>")
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({ embeds: [embed], components: [button] });
  }
};
