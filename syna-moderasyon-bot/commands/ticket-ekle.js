const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-ekle')
    .setDescription('Destek talebine birini ekle')
    .addUserOption(o => o.setName('kullanici').setDescription('Eklenecek kişi').setRequired(true)),

  async execute(interaction) {
    const u = interaction.options.getUser('kullanici');
    await interaction.channel.permissionOverwrites.edit(u.id, {
      ViewChannel: true, SendMessages: true, ReadMessageHistory: true,
    }).catch(()=>{});
    await interaction.reply({ content: `➕ <@${u.id}> ticket’e eklendi.` });
  },
};
