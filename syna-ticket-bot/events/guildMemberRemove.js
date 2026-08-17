const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberRemove',
  
  async execute(member) {
    try {
      // Çıkış log kanalını bul
      const exitLogChannel = member.guild.channels.cache.find(
        channel => channel.name === '💻┆kscikis-log'
      );

      if (!exitLogChannel) {
        console.log('Çıkış log kanalı bulunamadı: 💻┆kscikis-log');
        return;
      }

      // Kullanıcının rollerini al
      const userRoles = member.roles.cache
        .filter(role => role.name !== '@everyone')
        .map(role => role.toString())
        .join(' ');

      // Sunucu üye sayısını al
      const memberCount = member.guild.memberCount;

      // Çıkış tarihini hesapla
      const leaveTime = Math.floor(Date.now() / 1000);
      const leaveDate = new Date();
      const formattedDate = leaveDate.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      const formattedTime = leaveDate.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Ana mesaj
      const mainMessage = `**${member.user.username}** (${member.user.id}) sunucudan ayrıldı!\n**<t:${leaveTime}:F>** (<t:${leaveTime}:R>) Tarihinde ayrıldı!\n**Sunucu ${memberCount} Kişi oldu**`;

      // Embed oluştur
      const embed = new EmbedBuilder()
        .setDescription(`:outbox_tray: <@${member.user.id}>-(\`${member.user.id}\`) sunucudan **<t:${leaveTime}:F>** (<t:${leaveTime}:R>) Tarihinde ayrıldı!\n\nSunucu ***${memberCount}*** Kişi oldu\n\n> **KİŞİYLE ALAKALI BİLGİLER**\n\n${userRoles || '@everyone'}`)
        .setColor('#660000')
        .setAuthor({
          name: member.user.username,
          iconURL: member.user.displayAvatarURL()
        })
        .setThumbnail('https://cdn.discordapp.com/banners/1392876861645783212/331ca85535a4b6014f771de375247132.png?size=1024')
        .setFooter({ 
          text: 'Synatx - Çıkış Log',
          iconURL: member.guild.iconURL() || undefined
        })
        .setTimestamp();

      // Mesajı gönder
      await exitLogChannel.send({
        embeds: [embed]
      });

      console.log(`✅ Çıkış log gönderildi: ${member.user.username} (${member.user.id})`);
      
    } catch (error) {
      console.error('❌ Çıkış log gönderilirken hata:', error);
    }
  },
};
