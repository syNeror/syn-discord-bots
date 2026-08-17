const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('forceban')
        .setDescription('Bir kullanıcıyı sunucudan yasaklar')
        .addUserOption(option =>
            option
                .setName('üye')
                .setDescription('Yasaklanacak kullanıcı')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('sebep')
                .setDescription('Yasaklama sebebi (opsiyonel)')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('üye');
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
        
        // Embed oluştur
        const embed = new EmbedBuilder()
            .setAuthor({
                name: 'Bir kullanıcı sunucudan yasaklandı',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setThumbnail(moderator.displayAvatarURL({ dynamic: true, size: 256 }))
            .setColor(0xadd8e6)
            .setDescription(`**Yasaklama Sebebi:** \`\`\`fix\n${formattedReason}\n\`\`\``)
            .addFields(
                {
                    name: '<:1249678270862069780:1426723244144070778> Yasaklanan:',
                    value: `${targetUser} (\`${targetUser.id}\`)`,
                    inline: false
                },
                {
                    name: '<:1189889128377106492:1426713431372861562> Yasaklayan:',
                    value: `${moderator} (\`${moderator.id}\`)`,
                    inline: false
                },
                {
                    name: '<:1249678341280239697:1426723212506562591> Tarih:',
                    value: `<t:${Math.floor(now.getTime() / 1000)}:F> - <t:${Math.floor(now.getTime() / 1000) + 2}:R>`,
                    inline: false
                }
            )
            .setFooter({
                text: 'Synatx Bot\'s • Synatx.net',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

        try {
            // Kullanıcıyı banla
            await interaction.guild.members.ban(targetUser, { 
                reason: reason,
                deleteMessageDays: 7 
            });
            
            await interaction.reply({ embeds: [embed] });
            console.log(`✅ Kullanıcı yasaklandı: ${targetUser.tag} - ${moderator.tag}`);
            
        } catch (error) {
            console.error('❌ Ban hatası:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('❌ Hata!')
                .setDescription('Kullanıcı yasaklanırken bir hata oluştu.')
                .setFooter({
                    text: 'Synatx Bot\'s',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
                
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};
