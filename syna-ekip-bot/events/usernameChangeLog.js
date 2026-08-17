const { Events, EmbedBuilder } = require('discord.js');
const log = require('../data/log.json');

// TR tarih helper
const trDate = (d = new Date()) =>
  new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(d);

module.exports = {
  name: Events.GuildMemberUpdate,
  async execute(oldMember, newMember) {
    try {
      console.log('GuildMemberUpdate event tetiklendi');
      console.log('Eski username:', oldMember.user.username);
      console.log('Yeni username:', newMember.user.username);
      console.log('Eski nickname:', oldMember.nickname);
      console.log('Yeni nickname:', newMember.nickname);
      
      // Username veya nickname değişikliği kontrolü
      const usernameChanged = oldMember.user.username !== newMember.user.username;
      const nicknameChanged = oldMember.nickname !== newMember.nickname;
      
      if (!usernameChanged && !nicknameChanged) {
        console.log('Username ve nickname aynı, log atılmıyor');
        return;
      }
      
      console.log('Değişiklik tespit edildi - Username:', usernameChanged, 'Nickname:', nicknameChanged);

      // Log kanalını al
      const logChId = log['</ KATESHİ LOG />']['ksisim-log'];
      console.log('Log kanal ID:', logChId);
      if (!logChId) {
        console.log('Log kanal ID bulunamadı!');
        return;
      }

      const logCh = newMember.guild.channels.cache.get(logChId) ||
        await newMember.guild.channels.fetch(logChId).catch(() => null);
      console.log('Log kanal bulundu:', !!logCh);
      if (!logCh?.isTextBased()) {
        console.log('Log kanal text tabanlı değil!');
        return;
      }

      // Embed oluştur - görseldeki stile uygun
      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${newMember.user.username}`,
          iconURL: newMember.user.displayAvatarURL({ size: 256 })
        })
        .setDescription(`> <@${newMember.user.id}> tarafından <@${newMember.user.id}> kişisinin kullanıcı adı güncellendi.`)
        .addFields(
          { 
            name: '<:13917260748992021391:1413930672187375688> **Eski Adı**', 
            value: `\`\`\`fix\n${usernameChanged ? oldMember.user.username : (oldMember.nickname || 'Yok')}\n\`\`\``, 
            inline: false 
          },
          { 
            name: '<:13917260748992021391:1413930672187375688> **Yeni Adı**', 
            value: `\`\`\`fix\n${newMember.user.username}\n\`\`\``, 
            inline: false 
          },
          { 
            name: '<a:1389975446560440482:1413636566185807963> **Değiştiren Kişi**', 
            value: `\`\`\`fix\n<@${newMember.user.id}>\n\`\`\``, 
            inline: false 
          },
          { 
            name: '<a:13899754405501378661:1413636586830037125> **Sebep**', 
            value: `\`\`\`fix\nBelirtilmemiş\n\`\`\``, 
            inline: false 
          }
        )
        .setThumbnail(newMember.user.displayAvatarURL({ size: 256 }))
        .setColor(0xe91e63) // Pembe/magenta renk (görseldeki gibi)
        .setFooter({ text: "Synatx Bot's | Log Sistemi." });

      console.log('Embed gönderiliyor...');
      await logCh.send({ embeds: [embed] }).catch((sendErr) => {
        console.error('Embed gönderilirken hata:', sendErr);
      });
      console.log('Embed başarıyla gönderildi!');
    } catch (err) {
      console.error('Kullanıcı adı değişikliği logu gönderilemedi:', err);
    }
  }
};
