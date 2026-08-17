const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const cfg = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sunucu-restart')
    .setDescription('Sunucu restart bilgisini gönderir.')
    .addStringOption(o => o.setName('saat').setDescription('Restart saati (örn: 23:00)').setRequired(true)),
  async execute(interaction) {
    await interaction.reply({ content: 'İşlem Sürüyor Lütfen Bekleyiniz...', ephemeral: true });

    const saat = interaction.options.getString('saat', true);

    const embed = new EmbedBuilder()
      .setTitle(cfg.serverName)
      .setURL('https://discord.gg/seabots')
.setDescription(`Sunucumuza ${saat} saatinde **restart** atılıyor\n\n<:yildiz:1408494882854666411> \`Sunucu Durumu:\` **Aktif**\n<:fivem:1408494884637118474> \`Sunucu IP Adresi:\` **${cfg.serverIp || 'Yok'}** \n<:teamspeak12:1408494881248120922> \`Sunucu TS Adresi:\` **${cfg.serverIp || 'Yok'}** `)
      .setColor("#a94404") // kırmızı
      .setThumbnail(cfg.logo || null)
      .setImage(cfg.banner || null)
      .setFooter({ text: cfg.brandFooter || '' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Sunucuya Bağlan').setStyle(ButtonStyle.Link).setURL(cfg.joinUrl)
    );

await interaction.channel.send({
  content: `||@everyone & @here||`, // herkesi etiketler
  embeds: [embed],
  components: [row]
});
  }
};
