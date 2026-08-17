const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const config = require('../config.json');
const {
  getUserData, setUserData, nextPenaltyId, applyWarnRoles
} = require("../services/warnService");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("uyarısil")
    .setDescription("Kullanıcıdan uyarı sil")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(o => o.setName("kullanıcı").setDescription("Uyarısı silinecek kişi").setRequired(true))
    .addIntegerOption(o => o.setName("miktar").setDescription("Silinecek miktar (varsayılan 1)")),
  async execute(interaction) {
    // Sadece üst yetkili rolü kullanabilir
    if (config.üstyetkiliRolID && !interaction.member.roles.cache.has(config.üstyetkiliRolID)) {
      return interaction.reply({ content: '<:13899754306013758771:1414619305445691473> Bu komutu sadece **Üst Yetkili** rolü kullanabilir!', ephemeral: true });
    }

    const user = interaction.options.getUser("kullanıcı", true);
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ content: "Kullanıcı bulunamadı.", ephemeral: true });

    const amount = Math.max(1, interaction.options.getInteger("miktar") ?? 1);

    const data = await getUserData(interaction.guildId, user.id);
    const before = data.count;
    data.count = Math.max(0, data.count - amount);
    await setUserData(interaction.guildId, user.id, data);
    await applyWarnRoles(member, data.count, config);
    const id = await nextPenaltyId(interaction.guildId);
      const now = Math.floor(Date.now() / 1000);

    const embed = new EmbedBuilder()
      .setAuthor({ name: `${interaction.user.username} - UYARI SİLİNDİ` })
      .setDescription(`<@${interaction.user.id}> *tarafından bir kullanıcının uyarısı silindi.* \n\n **Uyarısı Silinen:** <@${user.id}> \n **Silen Yetkili:** <@${interaction.user.id}> \n **Silinen Uyarı Sayısı:** ${Math.min(amount, before)} \n **Kalan Uyarı Sayısı:** ${data.count} \n **Tarih** <t:${now}:R>`)
      .setFooter({ text: `${config.brandFooter.split(' | ')[0]} | Ceza Sistemi. | Ceza ID: #${id}`, iconURL: config.logo })
      .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 1024 }))

      .setColor("#1c541c");

    return interaction.reply({ embeds: [embed] });
  }
};
