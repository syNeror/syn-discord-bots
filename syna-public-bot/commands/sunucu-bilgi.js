const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sunucu-bilgi')
        .setDescription('Sunucu hakkında detaylı bilgi gösterir')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const guild = interaction.guild;
        
        // Sunucu bilgilerini al
        const memberCount = guild.memberCount;
        const onlineMembers = guild.members.cache.filter(member => member.presence?.status === 'online').size;
        const offlineMembers = memberCount - onlineMembers;
        const channelCount = guild.channels.cache.size;
        const roleCount = guild.roles.cache.size;
        const boostCount = guild.premiumSubscriptionCount || 0;
        const boostLevel = guild.premiumTier;
        
        // Oluşturulma tarihini formatla
        const createdAt = guild.createdAt.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // İlk kanalı bul
        const firstChannel = guild.channels.cache
            .filter(channel => channel.type === 0) // Text channels only
            .sort((a, b) => a.position - b.position)
            .first();
        
        // Embed oluştur
        const embed = new EmbedBuilder()
            .setTitle(`${guild.name} Sunucu Bilgisi`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
            .setColor(0xadd8e6)
            .addFields(
                {
                    name: 'Sunucu Adı',
                    value: guild.name,
                    inline: true
                },
                {
                    name: 'Sunucu ID',
                    value: guild.id,
                    inline: true
                },
                {
                    name: 'Üye Sayısı',
                    value: memberCount.toString(),
                    inline: true
                },
                {
                    name: 'Online Üyeler',
                    value: onlineMembers.toString(),
                    inline: true
                },
                {
                    name: 'Çevrimdışı Üyeler',
                    value: offlineMembers.toString(),
                    inline: true
                },
                {
                    name: 'Kanal Sayısı',
                    value: channelCount.toString(),
                    inline: true
                },
                {
                    name: 'Rol Sayısı',
                    value: roleCount.toString(),
                    inline: true
                },
                {
                    name: 'Boost Sayısı',
                    value: boostCount.toString(),
                    inline: true
                },
                {
                    name: 'Boost Seviyesi',
                    value: `Level ${boostLevel}`,
                    inline: true
                },
                {
                    name: 'Oluşturulma Tarihi',
                    value: createdAt,
                    inline: true
                },
                {
                    name: 'Bölge',
                    value: guild.preferredLocale || 'tr',
                    inline: true
                },
                {
                    name: 'İlk Kanal',
                    value: firstChannel ? firstChannel.name : 'Bilinmiyor',
                    inline: true
                }
            )
            .setFooter({
                text: 'Synatx Bot\'s',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
