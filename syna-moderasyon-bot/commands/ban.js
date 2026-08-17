// commands/ban.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.json');
const fs = require('fs');
const path = require('path');
const log = require('../log.json'); // {"Stban-log": "KANAL_ID"}

const STORE = path.join(__dirname, '..', 'punish.json');

function nextCezaId() {
  try {
    if (!fs.existsSync(STORE)) fs.writeFileSync(STORE, JSON.stringify({ lastId: 0 }, null, 2));
    const data = JSON.parse(fs.readFileSync(STORE, 'utf8'));
    data.lastId = Number(data.lastId || 0) + 1;
    fs.writeFileSync(STORE, JSON.stringify(data, null, 2));
    return data.lastId;
  } catch {
    return Math.floor(Date.now() / 1000);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Kişiyi sunucudan yasaklar.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(opt =>
      opt.setName('kullanıcı')
        .setDescription('Yasaklanacak kullanıcı')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('sebep')
        .setDescription('Ban sebebi (opsiyonel)')
        .setMaxLength(300)
    ),

  async execute(interaction) {
    // Sadece üst yetkili rolü kullanabilir
    if (config.üstyetkiliRolID && !interaction.member.roles.cache.has(config.üstyetkiliRolID)) {
      return interaction.reply({ content: '<:13899754306013758771:1414619305445691473> Bu komutu sadece **Üst Yetkili** rolü kullanabilir!', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('kullanıcı', true);
    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';
    const cezaId = nextCezaId();

    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: 'Bu komutu kullanmak için **Üyeleri Yasakla** iznine ihtiyacın var.', ephemeral: true });
    }
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: 'Benim **Üyeleri Yasakla** iznim yok.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: false }); // herkes görecek

    await interaction.guild.members.ban(targetUser.id, { reason }).catch(err => {
      throw new Error(`Ban işlemi başarısız: ${err.message}`);
    });

    const now = Math.floor(Date.now() / 1000);

    // --- Komuta verilen cevap (herkes görür) ---
    const replyEmbed = new EmbedBuilder()
      .setAuthor({ name: `${interaction.user.username}.`, iconURL: interaction.user.displayAvatarURL({ size: 256 }) })
      .setDescription(`${interaction.user} tarafından bir kişi sunucuda <t:${now}:R> yasaklandı. \n\n **Ceza Türü** \`BAN\` \n **Yasaklanan:** ${targetUser} \n **Yasaklayan:** ${interaction.user} \n **Sebep:** ${reason}`)
      .setThumbnail(interaction.guild.iconURL({ size: 256 }) || null)
    .setColor('#046404')
      .setFooter({ text: `${config.brandFooter.split(' | ')[0]} | Ceza Sistemi.`, iconURL: config.logo });

    await interaction.editReply({ embeds: [replyEmbed] });

    // --- Log kanalı ---
    const logChId = log['Stban-log'];
    const logCh = logChId
      ? (interaction.guild.channels.cache.get(logChId) || await interaction.guild.channels.fetch(logChId).catch(() => null))
      : null;

    if (logCh) {
      const logEmbed = new EmbedBuilder()
        .setAuthor({ name: `${interaction.user.username}.`, iconURL: interaction.user.displayAvatarURL({ size: 256 }) })
        .setDescription(`> <@${interaction.user.id}> tarafından ${targetUser} adlı kişi <t:${now}:R> önce sunucudan yasaklandı.`)
        .addFields(
          { name: '<:1389975434665525298:1413932211538886847> **Ceza Türü**', value: '\`BAN\`', inline: false },
          { name: '<:13917260748992021391:1413930672187375688> **Yasaklanan**', value: `\`\`\`fix\n${targetUser.tag} (${targetUser.id})\n\`\`\``, inline: false },
          { name: '<a:1389975446560440482:1413636566185807963> **Yasaklayan**', value: `\`\`\`fix\n${interaction.user.tag} (${interaction.user.id})\n\`\`\``, inline: false },
          { name: '<a:13899754405501378661:1413636586830037125> **Sebep**', value: `\`\`\`fix\n${reason}\n\`\`\``, inline: false }
        )
        .setThumbnail(interaction.guild.iconURL({ size: 256 }) || null)
    .setColor('#046404')
        .setFooter({ text: `${config.brandFooter.split(' | ')[0]} | Log Sistemi.`, iconURL: config.logo });

      // Ceza ID butonu (mavi, disabled)
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ban_ceza_id')
          .setLabel(`Ceza ID: #${cezaId}`)
          .setEmoji("<:1389975434665525298:1413932211538886847>")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true)
      );

      await logCh.send({ embeds: [logEmbed], components: [row] }).catch(() => {});
    }

    // --- Kullanıcıya DM ---
    await targetUser.send({
      embeds: [
        new EmbedBuilder()
          .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ size: 256 }) })
.setDescription(`<@${interaction.user.id}> tarafından sunucudan ${targetUser} önce yasaklandınız \n\n **Ceza Türü** \`BAN\` \n **Yasaklayan** ${targetUser} \n **Sebep:** ${reason}`)
          .setColor(0xff0000)
      ]
    }).catch(() => {});
  }
};
