const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Bir kullanıcının yasağını kaldırır')
        .addStringOption(option =>
            option
                .setName('kullanici_id')
                .setDescription('Yasağı kaldırılacak kullanıcının ID\'si')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('sebep')
                .setDescription('Yasak kaldırma sebebi (opsiyonel)')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const userId = interaction.options.getString('kullanici_id');
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';
        const moderator = interaction.user;
        
        // Tarih formatı
        const now = new Date();
        const dateStr = now.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        const timeStr = now.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Sebep formatı
        const formattedReason = `- ${reason} // ${moderator.tag} // ${now.getDate()}th ${now.toLocaleDateString('en-US', { month: 'long' })} ${now.getFullYear()} ${timeStr}`;
        
        try {
            // Kullanıcıyı unban et
            await interaction.guild.members.unban(userId, reason);
            
            // Embed oluştur
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: 'Bir kullanıcının yasağı kaldırıldı',
                    icon_url: interaction.client.user.displayAvatarURL()
                })
                .setThumbnail(moderator.displayAvatarURL({ dynamic: true, size: 256 }))
                .setColor(0x00ff00)
                .setDescription(`**Yasak Kaldırma Sebebi:** \`\`\`fix\n${formattedReason}\n\`\`\``)
                .addFields(
                    {
                        name: 'Yasak Kaldırılan:',
                        value: `<@${userId}> (\`${userId}\`)`,
                        inline: false
                    },
                    {
                        name: 'Yasak Kaldıran:',
                        value: `${moderator} (\`${moderator.id}\`)`,
                        inline: false
                    },
                    {
                        name: 'Tarih:',
                        value: `<t:${Math.floor(now.getTime() / 1000)}:F> - <t:${Math.floor(now.getTime() / 1000) + 2}:R>`,
                        inline: false
                    }
                )
                .setFooter({
                    text: 'Synatx Bot\'s • Synatx.net',
                    icon_url: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            console.log(`✅ Kullanıcı yasağı kaldırıldı: ${userId} - ${moderator.tag}`);
            
        } catch (error) {
            console.error('❌ Unban hatası:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('❌ Hata!')
                .setDescription('Kullanıcının yasağı kaldırılırken bir hata oluştu. Kullanıcı zaten yasaklı değil olabilir.')
                .setFooter({
                    text: 'Synatx Bot\'s',
                    icon_url: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
                
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};
