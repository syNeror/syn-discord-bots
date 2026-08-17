const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dmduyuru')
    .setDescription('Bütün yetkililere DM ile duyuru gönderir (düz metin).')
    .addRoleOption(o =>
      o.setName('rol')
        .setDescription('DM göndereceğin yetkili rolü')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('mesaj')
        .setDescription('Gönderilecek mesaj (DM içeriği)')
        .setRequired(true)
        .setMaxLength(1900)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const role = interaction.options.getRole('rol');
    const text = interaction.options.getString('mesaj');

    // 1) Komut anında başlangıç embedi
    const startEmbed = new EmbedBuilder()
      .setColor(0x2B2D31)
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setTitle('DM Duyuru')
      .setDescription(`**${text}**\n\n*Mesaj herkese gönderiliyor...*`)
      .setFooter({ text: `${config.brandFooter.split(' | ')[0]} | Yetkili Bildirim Sistemi.`, iconURL: config.logo });

    const sentMsg = await interaction.reply({ embeds: [startEmbed], fetchReply: true });

    // 2) Hedefleri topla
    const members = await interaction.guild.members.fetch();
    const targets = members.filter(m => m.roles.cache.has(role.id) && !m.user.bot);

    // DM içindeki butonlar (embed YOK)
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel(`${interaction.user.username} - ${interaction.user.id}`)
        .setStyle(ButtonStyle.Secondary)
        .setCustomId('sender_info')
        .setDisabled(true),
      new ButtonBuilder()
        .setLabel(interaction.guild.name)
        .setStyle(ButtonStyle.Secondary)
        .setCustomId('guild_info')
        .setDisabled(true)
    );

    let ok = 0;
    let fail = 0;

    // 3) DM gönder ve her birinden sonra kanala NORMAL mesaj at (reply değil)
    for (const [, member] of targets) {
      let delivered = false;
      try {
        await member.send({ content: text, components: [row] }); // düz metin
        delivered = true;
        ok++;
      } catch {
        delivered = false;
        fail++;
      }

      const line = `${member} kişisine ${delivered ? 'başarıyla' : 'gönderilemedi, DM kapalı olabilir.'} mesaj yollandı.`;
      await interaction.channel.send({
        content: line,
        allowedMentions: { users: [member.id] } // yalnızca o kişi mentionlansın; reply değil
      });
    }

    // 4) İlk embedi SONUÇ kartına çevir
    const resultEmbed = new EmbedBuilder()
      .setColor(0x2B2D31)
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setTitle('DM Duyuru Sonuçları')
      .setDescription(`**Başarıyla Gönderilenler** \`${String(ok)}\` \n **Gönderilemeyenler** \`${String(fail)}\` \n **Gönderilen Mesaj** \`${text.substring(0, 100)}\``)
      .setFooter({ text: `${config.brandFooter.split(' | ')[0]} | Yetkili Bildirim Sistemi.`, iconURL: config.logo });

    await interaction.editReply({ embeds: [resultEmbed] });
  },
};
