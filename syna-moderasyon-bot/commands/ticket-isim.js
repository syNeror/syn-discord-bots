const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-isim')
    .setDescription('Ticket kanalının ismini değiştir')
    .addStringOption(o => o.setName('yeni').setDescription('Yeni isim (örn: ┆1┆-oe)').setRequired(true)),

  async execute(interaction) {
    const yeni = interaction.options.getString('yeni');
    await interaction.channel.setName(yeni).catch(()=>{});
    await interaction.reply({ content: `✏️ Ticket adı **${yeni}** olarak değiştirildi.` });
  },
};
