const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fivem-status')
        .setDescription('FiveM servis durumlarını gösterir'),

    async execute(interaction) {
        // Servis listesi
        const services = [
            'CnL',
            'Forums', 
            'Games',
            'FiveM',
            'Game Services',
            'Policy',
            'Server List',
            'Web Services',
            'Keymaster',
            'FXServer'
        ];
        
        // Servis durumlarını oluştur
        const serviceStatus = services.map(service => 
            `${service} Çalışıyor. 🟢`
        ).join('\n');
        
        // Embed oluştur
        const embed = new EmbedBuilder()
            .setAuthor({
                name: interaction.user.username,
                icon_url: interaction.user.displayAvatarURL()
            })
            .setColor(0xadd8e6)
            .setDescription(serviceStatus)
            .setFooter({
                text: 'Synatx',
                icon_url: interaction.client.user.displayAvatarURL()
            });

        // Server icon varsa thumbnail ekle
        if (interaction.guild.iconURL()) {
            embed.setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 256 }));
        }

        // Server banner varsa image ekle
        if (interaction.guild.bannerURL()) {
            embed.setImage(interaction.guild.bannerURL({ dynamic: true, size: 1024 }));
        }

        await interaction.reply({ embeds: [embed] });
    },
};
