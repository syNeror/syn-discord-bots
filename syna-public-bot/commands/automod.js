const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Otomatik moderasyon sistemini yönetir')
        .addSubcommand(subcommand =>
            subcommand
                .setName('aktif')
                .setDescription('Automod sistemini etkinleştirir')
                .addStringOption(option =>
                    option
                        .setName('seçenek')
                        .setDescription('Hangi filtreyi aktif etmek istiyorsunuz?')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Link', value: 'link' },
                            { name: 'Küfür', value: 'kufur' },
                            { name: 'Synatx Special', value: 'special' }
                        )
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const option = interaction.options.getString('seçenek');
        
        // Her sunucu için ayrı ayar dosyası
        const automodDataPath = `./automodData_${interaction.guild.id}.json`;
        let automodData;
        
        try {
            automodData = require(automodDataPath);
        } catch (error) {
            // Dosya yoksa varsayılan ayarlar
            automodData = { link: false, kufur: false, special: false };
        }
        
        // Seçilen filtreyi aktif et
        if (option === 'link') {
            automodData.link = true;
        } else if (option === 'kufur') {
            automodData.kufur = true;
        } else if (option === 'special') {
            automodData.special = true;
        }
        
        // Ayar dosyasına kaydet
        fs.writeFileSync(automodDataPath, JSON.stringify(automodData, null, 2));
        
        // Embed oluştur
        const embed = new EmbedBuilder()
            .setAuthor({
                name: 'Automod Sistemi',
                icon_url: interaction.client.user.displayAvatarURL()
            })
            .setTitle('Automod Etkinleştirildi')
            .setColor(0x00ff00)
            .setDescription(`**Seçilen Filtre:** ${option === 'link' ? 'Link' : option === 'kufur' ? 'Küfür' : 'Synatx Special'}\n\nAutomod sistemi başarıyla etkinleştirildi!`)
            .setFooter({
                text: 'Synatx Bot\'s • Synatx.net',
                icon_url: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        
        console.log(`✅ Automod etkinleştirildi: ${option} - ${interaction.user.tag}`);
    },
};
