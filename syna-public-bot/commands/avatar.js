const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Bir kullanıcının avatarını gösterir')
        .addUserOption(option =>
            option
                .setName('kullanıcı')
                .setDescription('Avatarını görmek istediğiniz kullanıcı')
                .setRequired(false)
        ),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;
        
        // Avatar URL'lerini al
        const avatarURL = targetUser.displayAvatarURL({ dynamic: true, size: 4096 });
        const avatarPNG = targetUser.displayAvatarURL({ extension: 'png', size: 4096 });
        const avatarJPG = targetUser.displayAvatarURL({ extension: 'jpg', size: 4096 });
        const avatarWEBP = targetUser.displayAvatarURL({ extension: 'webp', size: 4096 });
        
        // Direkt mesaj olarak gönder
        const message = `> [${targetUser.username}](${avatarURL})`;
        
        await interaction.reply(message);
    },
};
