const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketsayi')
    .setDescription('Bir kişinin açtığı ticket sayısını gösterir')
    .addUserOption(o => o.setName('kullanici').setDescription('Varsayılan: kendin')),

  async execute(interaction, client) {
    if (!client.ticketStore) client.ticketStore = { userOpenCounts: new Map() };
    const u = interaction.options.getUser('kullanici') ?? interaction.user;
    const n = client.ticketStore.userOpenCounts.get(u.id) ?? 0;
    await interaction.reply({ content: `📊 <@${u.id}> toplam **${n}** ticket açmış.` });
  },
};
