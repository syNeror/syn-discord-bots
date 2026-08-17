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
    .setName('sunucu-bakim')
    .setDescription('Sunucunun bakımda olduğunu bildirir.')
    .addStringOption(o => o.setName('baslangic').setDescription('Bakım başlangıç saati (örn: 22:00)').setRequired(true))
    .addStringOption(o => o.setName('bitis').setDescription('Bakım bitiş saati (örn: 23:00)').setRequired(true)),
  async execute(interaction) {
    await interaction.reply({ content: 'İşlem Sürüyor Lütfen Bekleyiniz...', ephemeral: true });

    const bas = interaction.options.getString('baslangic', true);
    const bit = interaction.options.getString('bitis', true);

    const embed = new EmbedBuilder()
      .setTitle(cfg.serverName)
      .setURL('https://discord.gg/seabots')
.setDescription(`Sunucumuz artık **Bakımda,** sunucuya ${bas} saatinde giriş yapabilirsiniz. (Bakım bitiş saati: ${bit} )\n\n<:yildiz:1408494882854666411> \`Sunucu Durumu:\` **Bakımda**\n<:fivem:1408494884637118474> \`Sunucu IP Adresi:\` **${cfg.serverIp || 'Yok'}** \n<:teamspeak12:1408494881248120922> \`Sunucu TS Adresi:\` **${cfg.serverIp || 'Yok'}** `)
      .setColor("#f6de5c") // sarı
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
