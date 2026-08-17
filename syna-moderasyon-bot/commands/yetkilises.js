// yetkilises.js — /yetkilises role:<Rol>
// Seste olan/olmayan ve aktif olan yetkilileri listeler.
// "Yetkilileri Sese Çağır" butonuna basınca, hedeflere otomatik DM gönderir ve sonuçları yazar.

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ComponentType,
} = require('discord.js');
const config = require('../config.json');

const CALL_BUTTON_ID = 'yetkilileri_cagir';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yetkilises')
    .setDescription('Yetkili ses durumlarını listeler ve çağrı gönderir.')
    .addRoleOption(o =>
      o.setName('rol')
        .setDescription('Hedef yetkili rolü')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const role = interaction.options.getRole('rol');
    await interaction.deferReply({ ephemeral: false });

    const members = await interaction.guild.members.fetch();

    const staff = members.filter(m => m.roles.cache.has(role.id) && !m.user.bot);
    const inVoice = staff.filter(m => m.voice?.channelId);
    const notInVoice = staff.filter(m => !m.voice?.channelId);
    const active = staff.filter(m => m.presence && m.presence.status !== 'offline');

    // Üstte özet embed
    const overview = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('Yetkili Aktiflik')
      .addFields(
        { name: 'Toplam Yetkili', value: String(staff.size), inline: true },
        { name: 'Seste Olan Yetkili', value: String(inVoice.size), inline: true },
        { name: 'Seste Olmayan Yetkili', value: String(notInVoice.size), inline: true },
        { name: 'Aktif Yetkili', value: String(active.size), inline: true },
      )
      .setThumbnail(interaction.guild.iconURL({ size: 256 }))
      .setFooter({ text: 'Z◉NE Autorazer | UYG' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(CALL_BUTTON_ID)
        .setLabel('Yetkilileri Sese Çağır')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.editReply({ embeds: [overview], components: [row] });

    // Detay listeler
    const listFormat = (col) => col.size ? Array.from(col.values()).map(m => m.toString()).join(', ') : '—';
    await interaction.followUp({
      content:
        `**Seste Olan Yetkililer:**\n${listFormat(inVoice)}\n\n` +
        `**Seste Olmayan Yetkililer:**\n${listFormat(notInVoice)}\n\n` +
        `**Aktif Olan Yetkililer:**\n${listFormat(active)}`,
      allowedMentions: { users: [] }
    });

    // Buton dinleyici (sadece komutu kullanan kişi kullanabilsin)
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 5 * 60 * 1000
    });

    collector.on('collect', async (btn) => {
      if (btn.customId !== CALL_BUTTON_ID) return;
      if (btn.user.id !== interaction.user.id) {
        return btn.reply({ content: 'Bu butonu sadece komutu kullanan kişi kullanabilir.', ephemeral: true });
      }

      await btn.deferUpdate();

      // Çağrı DM metni (6. görseldeki gibi)
      const callEmbed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setTitle('Otomatik Aktiflik mesajı')
        .setDescription(
`Selamlar ${interaction.user}, 
Bu mesaj Sana ${interaction.user} Tarafından **${interaction.guild.name}** isimli sunucudan yollanmaktadır

Sunucumuzun Yetkilisi Olarak **Aktifliğini artırmanı ve sese geçmeni** rica ediyoruz

Normalde Aktif birisi olabilirsin bu mesaj otomatik olarak **aktif olup seste olmayan** herkese yollanmıştır`
        )
        .setThumbnail('https://cdn.discordapp.com/icons/0/0.png') // istersen değiştir
        .setFooter({ text: `${config.brandFooter.split(' | ')[0]} | Yetkili Bildirim Sistemi.`, iconURL: config.logo });

      const sentTo = [];
      let ok = 0, fail = 0;

      // Hedef: seste olmayanlar
      for (const [, member] of notInVoice) {
        try {
          await member.send({
            content: 'Synatx den selamlarr',
            embeds: [callEmbed],
            components: [
              new ActionRowBuilder().addComponents(
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
              )
            ]
          });
          ok++;
          sentTo.push(member.toString());
        } catch {
          fail++;
        }
      }

      // Sonuç kartı + tek tek kimlere gittiği
      const result = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
        .setTitle('DM Duyuru Sonuçları')
        .addFields(
          { name: 'Başarıyla Gönderilenler', value: String(ok), inline: true },
          { name: 'Gönderilemeyenler', value: String(fail), inline: true },
        )
        .setFooter({ text: `${config.brandFooter.split(' | ')[0]} | Yetkili Bildirim Sistemi.`, iconURL: config.logo });

      await interaction.followUp({ embeds: [result] });

      if (sentTo.length) {
        const chunSt = chunkArray(sentTo.map(s => `${s} kişisine başarıyla mesaj yollandı.`), 10);
        for (const c of chunSt) {
          await interaction.followUp({ content: c.join('\n') });
        }
      }

      // Butonu devre dışı bırak
      const disabled = ActionRowBuilder.from(row);
      disabled.components[0].setDisabled(true).setLabel('Buton Kullanıldı ve Deaktif kılındı...');
      await interaction.editReply({ components: [disabled] });
    });
  },
};

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
