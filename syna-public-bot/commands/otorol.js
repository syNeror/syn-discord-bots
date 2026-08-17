const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('otorol')
        .setDescription('Otorol sistemi yönetimi')
        .addSubcommand(subcommand =>
            subcommand
                .setName('ayarla')
                .setDescription('Otorol sistemini ayarla')
                .addRoleOption(option =>
                    option
                        .setName('rol')
                        .setDescription('Yeni üyelere verilecek rol')
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option
                        .setName('kanal')
                        .setDescription('Otorol verdiğimi söyleyeceğim kanal')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('iptal')
                .setDescription('Otorol sistemini iptal et')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'ayarla') {
            const role = interaction.options.getRole('rol');
            const channel = interaction.options.getChannel('kanal');

            // Otorol verilerini kaydet
            const autoRoleData = {
                enabled: true,
                roleId: role.id,
                channelId: channel.id,
                guildId: interaction.guild.id,
                setBy: interaction.user.id,
                setAt: new Date().toISOString()
            };

            // Her sunucu için ayrı ayar dosyası
            const autoRoleDataPath = `./autoRoleData_${interaction.guild.id}.json`;
            fs.writeFileSync(autoRoleDataPath, JSON.stringify(autoRoleData, null, 2));

            // Başarı embed'i
            const embed = {
                color: 0xadd8e6,
                description: `╔▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
║
║ • Ayarlanan Kanal: ${channel}
║
║ • Ayarlanan Rol: ${role}
║
║ • Artık yeni gelen üyelere vereceğim rolü ayarladım!
║
╚▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`,
                footer: {
                    text: 'Synatx Otorol Sistemi',
                    icon_url: interaction.client.user.displayAvatarURL()
                },
                timestamp: new Date().toISOString()
            };

            await interaction.reply({ embeds: [embed] });

        } else if (subcommand === 'iptal') {
            // Otorol verilerini temizle
            const autoRoleData = {
                enabled: false,
                roleId: null,
                channelId: null,
                guildId: interaction.guild.id,
                disabledBy: interaction.user.id,
                disabledAt: new Date().toISOString()
            };

            // Her sunucu için ayrı ayar dosyası
            const autoRoleDataPath = `./autoRoleData_${interaction.guild.id}.json`;
            fs.writeFileSync(autoRoleDataPath, JSON.stringify(autoRoleData, null, 2));

            // İptal embed'i
            const embed = {
                color: 0x660000,
                description: `╔▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
║
║ • Otorol sistemi başarıyla kapatıldı.
║
╚▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`,
                footer: {
                    text: 'Synatx Otorol Sistemi',
                    icon_url: interaction.client.user.displayAvatarURL()
                },
                timestamp: new Date().toISOString()
            };

            await interaction.reply({ embeds: [embed] });
        }
    },
};
