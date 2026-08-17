const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require('../config.json');
const fs = require("fs");
const path = require("path");
const {
  getUserData, setUserData, nextPenaltyId, applyWarnRoles
} = require("../services/warnService");

const CEZA_PATH = path.join(__dirname, "..", "cezalar.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("uyarı")
    .setDescription("Kullanıcıya uyarı ekle")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(o => o.setName("kullanıcı").setDescription("Uyarı verilecek kişi").setRequired(true))
    .addIntegerOption(o => o.setName("miktar").setDescription("Eklenecek miktar (varsayılan 1)"))
    .addStringOption(o => o.setName("sebep").setDescription("Sebep (opsiyonel)")),
  
  async execute(interaction) {
    // Sadece üst yetkili rolü kullanabilir
    if (config.üstyetkiliRolID && !interaction.member.roles.cache.has(config.üstyetkiliRolID)) {
      return interaction.reply({ content: '<:13899754306013758771:1414619305445691473> Bu komutu sadece **Üst Yetkili** rolü kullanabilir!', ephemeral: true });
    }

    const user = interaction.options.getUser("kullanıcı", true);
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ content: "Kullanıcı bulunamadı.", ephemeral: true });

    const amount = Math.max(1, interaction.options.getInteger("miktar") ?? 1);
    const reason = interaction.options.getString("sebep") ?? "Belirtilmedi";

    const data = await getUserData(interaction.guildId, user.id);
    data.count += amount;
    data.total += amount;
    await setUserData(interaction.guildId, user.id, data);
    await applyWarnRoles(member, data.count, config);
    const id = await nextPenaltyId(interaction.guildId);

    // ✅ cezalar.json dosyasına kaydet
    let cezalar = [];
    if (fs.existsSync(CEZA_PATH)) {
      cezalar = JSON.parse(fs.readFileSync(CEZA_PATH, "utf8"));
    }
    cezalar.push({
      id,
      guild: interaction.guildId,
      user: user.id,
      staff: interaction.user.id,
      type: "UYARI",
      reason,
      amount,
      date: Date.now()
    });
    fs.writeFileSync(CEZA_PATH, JSON.stringify(cezalar, null, 2));

    // Şu anki unix timestamp
    const now = Math.floor(Date.now() / 1000);

    // ✅ Embed
    const embed = new EmbedBuilder()
      .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
      .setDescription(
        `<@${interaction.user.id}> tarafından bir kişiye sunucuda <t:${now}:R> uyarı verildi. \n\n` +
        `**Ceza Türü:** \`UYARI\` \n` +
        `**Ceza Veren:** <@${interaction.user.id}> \n` +
        `**Ceza Alan:** <@${user.id}> \n\n` +
        `**Uyarı Miktarı:** \`${amount}\` \n` +
        `**Toplam Uyarısı:** \`${data.count}\` \n` +
        `**Sebep:** ${reason}`
      )
      .setFooter({ text: `${config.brandFooter.split(' | ')[0]} | Ceza Sistemi. | Ceza ID: #${id}`, iconURL: config.logo })
      .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 1024 }))
      .setColor("#1c541c");

    // ✅ Ceza ID butonu
    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ceza_${id}`)
        .setLabel(`Ceza ID: #${id}`)
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({ embeds: [embed], components: [button] });
  }
};
