const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-cikar')
    .setDescription('Destek talebinden birini çıkar')
    .addUserOption(o => o.setName('kullanici').setDescription('Çıkarılacak kişi').setRequired(true)),

  async execute(interaction) {
    const u = interaction.options.getUser('kullanici');
    await interaction.channel.permissionOverwrites.edit(u.id, { ViewChannel: false }).catch(()=>{});
    await interaction.reply({ content: `➖ <@${u.id}> ticket’ten çıkarıldı.` });
  },
};
