const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rol-tasi')
        .setDescription('Belirli bir roldeki tüm üyeleri seçilen diğer bir role taşır')
        .addRoleOption(option =>
            option
                .setName('kaynak_rol')
                .setDescription('Üyelerin alınacağı kaynak rol')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option
                .setName('hedef_rol')
                .setDescription('Üyelerin taşınacağı hedef rol')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const sourceRole = interaction.options.getRole('kaynak_rol');
        const targetRole = interaction.options.getRole('hedef_rol');
        const moderator = interaction.user;
        
        // Aynı rol seçilmişse hata ver
        if (sourceRole.id === targetRole.id) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('❌ Hata!')
                .setDescription('Kaynak rol ve hedef rol aynı olamaz!')
                .setFooter({
                    text: 'Synatx Bot\'s',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
                
            return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
        
        // Kaynak roldeki üyeleri bul
        const membersWithSourceRole = interaction.guild.members.cache.filter(member => 
            member.roles.cache.has(sourceRole.id)
        );
        
        if (membersWithSourceRole.size === 0) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('❌ Hata!')
                .setDescription(`${sourceRole} rolünde hiç üye bulunamadı!`)
                .setFooter({
                    text: 'Synatx Bot\'s',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
                
            return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
        
        // Embed oluştur
        const embed = new EmbedBuilder()
            .setAuthor({
                name: 'Rol Taşıma İşlemi',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTitle('🔄 Rol Taşıma Başlatıldı')
            .setColor(0xadd8e6)
            .setDescription(`**Kaynak Rol:** ${sourceRole}\n**Hedef Rol:** ${targetRole}\n**Taşınacak Üye Sayısı:** ${membersWithSourceRole.size}`)
            .setFooter({
                text: 'Synatx Bot\'s • Synatx.net',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        
        // Üyeleri taşı
        let successCount = 0;
        let errorCount = 0;
        
        for (const [memberId, member] of membersWithSourceRole) {
            try {
                await member.roles.remove(sourceRole);
                await member.roles.add(targetRole);
                successCount++;
            } catch (error) {
                console.error(`❌ Rol taşıma hatası: ${member.user.tag}`, error);
                errorCount++;
            }
        }
        
        // Sonuç embed'i
        const resultEmbed = new EmbedBuilder()
            .setAuthor({
                name: 'Rol Taşıma Tamamlandı',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTitle('✅ Rol Taşıma İşlemi Tamamlandı')
            .setColor(0x00ff00)
            .setDescription(`**Kaynak Rol:** ${sourceRole}\n**Hedef Rol:** ${targetRole}\n\n**Başarılı:** ${successCount} üye\n**Hatalı:** ${errorCount} üye`)
            .setFooter({
                text: 'Synatx Bot\'s • Synatx.net',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();
            
        await interaction.followUp({ embeds: [resultEmbed] });
        
        console.log(`✅ Rol taşıma tamamlandı: ${sourceRole.name} → ${targetRole.name} (${successCount} başarılı, ${errorCount} hatalı)`);
    },
};
