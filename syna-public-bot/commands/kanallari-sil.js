const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kanallari-sil')
        .setDescription('Belirtilen kategorideki tüm kanalları siler')
        .addStringOption(option =>
            option
                .setName('kategori')
                .setDescription('Silinecek kanalların bulunduğu kategori ID\'si')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        const categoryId = interaction.options.getString('kategori');
        const moderator = interaction.user;
        
        // Kategoriyi bul
        const category = interaction.guild.channels.cache.get(categoryId);
        
        if (!category) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Hata')
                .setDescription('Belirtilen kategori bulunamadı!')
                .setFooter({
                    text: 'Synatx Bot\'s',
                    icon_url: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
                
            return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
        
        if (category.type !== ChannelType.GuildCategory) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Hata')
                .setDescription('Belirtilen ID bir kategori değil!')
                .setFooter({
                    text: 'Synatx Bot\'s',
                    icon_url: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
                
            return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
        
        // Kategorideki kanalları bul
        const channelsInCategory = category.children.cache.filter(channel => 
            channel.type !== ChannelType.GuildCategory
        );
        
        if (channelsInCategory.size === 0) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Hata')
                .setDescription('Kategoride silinecek kanal bulunamadı!')
                .setFooter({
                    text: 'Synatx Bot\'s',
                    icon_url: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
                
            return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
        
        // Başlangıç embed'i
        const startEmbed = new EmbedBuilder()
            .setAuthor({
                name: 'Kanal Silme İşlemi',
                icon_url: interaction.client.user.displayAvatarURL()
            })
            .setTitle('Kanal Silme Başlatıldı')
            .setColor(0xadd8e6)
            .setDescription(`**Kategori:** ${category.name}\n**Silinecek Kanal Sayısı:** ${channelsInCategory.size}`)
            .setFooter({
                text: 'Synatx Bot\'s • Synatx.net',
                icon_url: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [startEmbed] });
        
        // Kanalları sil
        let successCount = 0;
        let errorCount = 0;
        const deletedChannels = [];
        
        for (const [channelId, channel] of channelsInCategory) {
            try {
                await channel.delete();
                deletedChannels.push(channel.name);
                successCount++;
            } catch (error) {
                console.error(`Kanal silme hatası: ${channel.name}`, error);
                errorCount++;
            }
        }
        
        // Sonuç embed'i
        const resultEmbed = new EmbedBuilder()
            .setAuthor({
                name: 'Kanal Silme Tamamlandı',
                icon_url: interaction.client.user.displayAvatarURL()
            })
            .setTitle('Kanal Silme İşlemi Tamamlandı')
            .setColor(0x00ff00)
            .setDescription(`**Kategori:** ${category.name}\n\n**Başarılı:** ${successCount} kanal\n**Hatalı:** ${errorCount} kanal`)
            .addFields(
                {
                    name: 'Silinen Kanallar',
                    value: deletedChannels.length > 0 ? deletedChannels.join(', ') : 'Yok',
                    inline: false
                }
            )
            .setFooter({
                text: 'Synatx Bot\'s • Synatx.net',
                icon_url: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();
            
        await interaction.followUp({ embeds: [resultEmbed] });
        
        console.log(`Kanal silme tamamlandı: ${category.name} (${successCount} başarılı, ${errorCount} hatalı)`);
    },
};
