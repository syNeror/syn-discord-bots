const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} = require('discord.js');
const config = require('../config.json');

// HTML Transcript oluşturma fonksiyonu
async function createHTMLTranscript(channel) {
  try {
    const messages = [];
    let lastMessageId = null;
    
    // Tüm mesajları topla
    while (true) {
      const fetchedMessages = await channel.messages.fetch({ 
        limit: 100, 
        before: lastMessageId 
      });
      
      if (fetchedMessages.size === 0) break;
      
      messages.push(...fetchedMessages.values());
      lastMessageId = fetchedMessages.last().id;
    }
    
    // Mesajları ters çevir (eski → yeni)
    messages.reverse();
    
    // Kullanıcı profillerini oluştur
    const profiles = {};
    messages.forEach(msg => {
      if (!profiles[msg.author.id]) {
        profiles[msg.author.id] = {
          author: msg.author.username,
          avatar: msg.author.displayAvatarURL({ size: 64 }),
          bot: msg.author.bot,
          verified: false
        };
      }
    });
    
    // HTML oluştur (Discord transcript formatında - tek satır)
    const html = `<html><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="icon" type="image/png" href="https://cdn.discordapp.com/icons/1392876861645783212/ad1c820218bed3a75e4d724cea53eff0.png?size=16"/><title>${channel.name}</title><script>document.addEventListener("click",t=>{let e=t.target;if(!e)return;let o=e?.getAttribute("data-goto");if(o){let r=document.getElementById(\`m-\${o}\`);r?(r.scrollIntoView({behavior:"smooth",block:"center"}),r.style.backgroundColor="rgba(148, 156, 247, 0.1)",r.style.transition="background-color 0.5s ease",setTimeout(()=>{r.style.backgroundColor="transparent"},1e3)):console.warn("Message not found.")}});</script><script>window.$discordMessage={profiles:${JSON.stringify(profiles)}}}</script><script type="module" src="https://cdn.jsdelivr.net/npm/@derockdev/discord-components-core@^3.6.1/dist/derockdev-discord-components-core/derockdev-discord-components-core.esm.js"></script></head><body style="margin:0;min-height:100vh"><discord-messages style="min-height:100vh"><discord-header guild="${channel.guild.name}" channel="${channel.name}" icon="${channel.guild.iconURL({ size: 128 })}">${messages[0]?.author.id || ''}</discord-header>${messages.map(msg => {
      const timestamp = msg.createdAt.toISOString();
      const content = msg.content || '';
      const mentions = content.match(/<@!?(\d+)>/g) || [];
      let processedContent = content;
      mentions.forEach(mention => {
        const userId = mention.match(/<@!?(\d+)>/)[1];
        const user = channel.guild.members.cache.get(userId);
        if (user) {
          processedContent = processedContent.replace(mention, `<discord-mention type="user">${user.user.username}</discord-mention>`);
        }
      });
      let embedContent = '';
      if (msg.embeds && msg.embeds.length > 0) {
        embedContent = msg.embeds.map(embed => {
          let embedHtml = `<discord-embed embed-title="${embed.title || ''}" slot="embeds" color="${embed.color || '#5865f2'}"`;
          if (embed.thumbnail) embedHtml += ` thumbnail="${embed.thumbnail.url}"`;
          if (embed.image) embedHtml += ` image="${embed.image.url}"`;
          embedHtml += '>';
          if (embed.description) {
            embedHtml += `<discord-embed-description slot="description">${embed.description}</discord-embed-description>`;
          }
          if (embed.fields && embed.fields.length > 0) {
            embedHtml += '<discord-embed-fields slot="fields">';
            embed.fields.forEach(field => {
              embedHtml += `<discord-embed-field field-title="${field.name}" inline="${field.inline}">${field.value}</discord-embed-field>`;
            });
            embedHtml += '</discord-embed-fields>';
          }
          if (embed.footer) {
            embedHtml += `<discord-embed-footer slot="footer"${embed.footer.iconURL ? ` footer-image="${embed.footer.iconURL}"` : ''}>${embed.footer.text}</discord-embed-footer>`;
          }
          embedHtml += '</discord-embed>';
          return embedHtml;
        }).join('');
      }
      let attachmentContent = '';
      if (msg.attachments && msg.attachments.size > 0) {
        attachmentContent = '<discord-attachments slot="components">';
        msg.attachments.forEach(attachment => {
          attachmentContent += `<discord-attachment slot="attachment" url="${attachment.url}" filename="${attachment.name}"></discord-attachment>`;
        });
        attachmentContent += '</discord-attachments>';
      }
      return `<discord-message id="m-${msg.id}" timestamp="${timestamp}" edited="false" highlight="false" profile="${msg.author.id}">${processedContent}${embedContent}${attachmentContent}</discord-message>`;
    }).join('')}<div style="text-align:center;width:100%">Ticketta ${messages.length} Mesaj var </div></discord-messages></body></html>`;
    
    return html;
  } catch (error) {
    console.error("HTML transcript oluşturma hatası:", error);
    return null;
  }
}

module.exports = {
  name: 'interactionCreate',

  async execute(interaction) {
    if (!interaction.isButton()) return;

    const svname = interaction.guild.name;
    const timestamp = Math.floor(Date.now() / 1000);
    const fs = require('fs');
    const path = require('path');
    const ticketIdPath = path.join(__dirname, '../ticketid.json');

    const ticketTypes = {
      create_ticket: 'Ticket Oluştur',
      price_info: 'Fiyat bilgisi almak istiyorum',
      partner: 'Partnerlik',
    };

    // === TICKET OLUŞTURMA ===
    if (['create_ticket', 'price_info', 'partner'].includes(interaction.customId)) {
      await interaction.deferReply({ ephemeral: true });

      const existingChannel = interaction.guild.channels.cache.find(
        (c) => c.name === `ticket-${interaction.user.id}`
      );

      if (existingChannel) {
        return interaction.editReply({
          content: `Zaten açık bir ticketiniz var: ${existingChannel}`,
        });
      }

      const kategori = ticketTypes[interaction.customId] || 'Bilinmeyen';
      let ticketIdData = JSON.parse(fs.readFileSync(ticketIdPath, 'utf8'));
      ticketIdData.lastId += 1;
      fs.writeFileSync(ticketIdPath, JSON.stringify(ticketIdData, null, 2));
      const ticketId = ticketIdData.lastId;

      const ticketChannel = await interaction.guild.channels.create({
        name: `┇${ticketId}┇${interaction.user.username}`,
        type: ChannelType.GuildText,
        topic: interaction.user.id,
        parent: config.ticketCategoryId,
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
          {
            id: config.yetkiliRolId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
        ],
      });

      // === Emoji Sistemi ===
      const ticketEmojis = {
        create_ticket: '<a:emote_coin:1391552179214749858>',
        price_info: '<a:money:1373229370918965361>',
        partner: '<a:higif:1391552083961970888>',
      };

      // === Bilgilendirici Embed ===
      const embed = new EmbedBuilder()
        .setTitle(`${ticketEmojis[interaction.customId] || '🎟️'} ${kategori} Kategorili Destek!`)
        .setDescription(`> <@${interaction.user.id}> kişisi **<t:${timestamp}:R>** tarihinde destek talebi oluşturdu.\nOluşturulan destek talebinin bilgilerini aşağıda belirttim;\n\n**Kullanıcı:**\n\`\`\`yaml\n${interaction.user.username}\n\`\`\`\n**Kategori:**\n\`\`\`yaml\n${kategori}\n\`\`\``)
        .setColor('#a6cfdc')
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: `${svname}`, iconURL: interaction.guild.iconURL() });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('yetkili_sahiplen')
          .setLabel('ʏᴇᴛᴋɪʟɪ - sᴀʜɪᴘʟᴇɴ')
          .setEmoji('👥')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('yetkili_kapat')
          .setLabel('ʏᴇᴛᴋɪʟɪ - ᴋᴀᴘᴀᴛ')
          .setEmoji('💾')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('oyuncu_kapat')
          .setLabel('ᴏʏᴜɴᴄᴜ - ᴋᴀᴘᴀᴛ')
          .setEmoji('⚙️')
          .setStyle(ButtonStyle.Success)
      );

      await ticketChannel.send({
        content: `<@&${config.yetkiliRolId}> | <@${interaction.user.id}>`,
        embeds: [embed],
        components: [row],
      });

      // === Hızlı Cevap Sistemi Embed + Buton ===
      const fiyatEmbed = new EmbedBuilder()
        .setTitle('Hızlı Cevap Sistemi')
        .setDescription('Hoş geldiniz, alttaki butona basarak **fiyat bilgisi** alabilirsiniz.')
        .setFooter({ text: 'Synatx' });

      const fiyatRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('fiyat_text')
          .setLabel('Fiyat Bilgisi')
          .setStyle(ButtonStyle.Success)
      );

      await ticketChannel.send({ embeds: [fiyatEmbed], components: [fiyatRow] });

      await interaction.editReply({
        content: `✔️ Destek talebin başarıyla oluşturuldu: ${ticketChannel}`,
      });
    }

    // === FİYAT BUTONU ===
    if (interaction.customId === 'fiyat_text') {
      await interaction.reply({
        content: `
**Starter Pack – 500₺**
 **Basic Pack – 700₺**
  **Standart Pack – 900₺**
  **Master Pack – 1200₺**

## <a:1373052121213308969:1391552489983053935>  Standard Pricing
- **Logo** : 250₺  
- **Banner** : 200₺
    `,
        ephemeral: false
      });
    }

    // === YETKİLİ SAHİPLEN ===
    if (interaction.customId === 'yetkili_sahiplen') {
      if (!interaction.member.roles.cache.has(config.yetkiliRolId)) {
        return interaction.reply({
          content: '❌ Bu butonu sadece yetkililer kullanabilir.',
          ephemeral: true,
        });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('yetkili_sahiplen')
          .setLabel('ʏᴇᴛᴋɪʟɪ - sᴀʜɪᴘʟᴇɴ')
          .setEmoji('👥')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('yetkili_kapat')
          .setLabel('ʏᴇᴛᴋɪʟɪ - ᴋᴀᴘᴀᴛ')
          .setEmoji('💾')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('oyuncu_kapat')
          .setLabel('ᴏʏᴜɴᴄᴜ - ᴋᴀᴘᴀᴛ')
          .setEmoji('⚙️')
          .setStyle(ButtonStyle.Success)
      );

      await interaction.update({ components: [row] });

      const webhook = await interaction.channel.createWebhook({
        name: 'Destek',
        avatar: interaction.user.displayAvatarURL(),
      });

      await webhook.send({
        content: `Merhaba, ben <@${interaction.user.id}>. Size nasıl yardımcı olabilirim?`,
      });

      setTimeout(() => webhook.delete().catch(() => {}), 5000);
    }

    // === YETKİLİ KAPAT ===
    if (interaction.customId === 'yetkili_kapat') {
      if (!interaction.member.roles.cache.has(config.yetkiliRolId)) {
        return interaction.reply({
          content: '❌ Bu butonu sadece yetkililer kullanabilir.',
          ephemeral: true,
        });
      }

      // Ticket bilgilerini topla
      const ticketOwnerId = interaction.channel.topic;
      const ticketOwner = await interaction.guild.members.fetch(ticketOwnerId).catch(() => null);
      const ticketName = interaction.channel.name;
      const ticketId = ticketName.split('┇')[1] || 'Bilinmiyor';

      // Ticket açılış tarihi (kanal oluşturulma tarihi)
      const ticketOpenTime = Math.floor(interaction.channel.createdTimestamp / 1000);
      const ticketCloseTime = Math.floor(Date.now() / 1000);

      // Ticket kategorisini belirle
      let ticketCategory = 'Destek, Bug & Teknik Sorumlar'; // Varsayılan kategori

      // Stats dosyasını güncelle
      const statsPath = path.join(__dirname, '../ticketStats.json');
      let statsData = {};
      
      try {
        // Mevcut stats dosyasını oku
        if (fs.existsSync(statsPath)) {
          const statsContent = fs.readFileSync(statsPath, 'utf8');
          statsData = JSON.parse(statsContent);
        }
        
        // Ticket'ı kapatan kişinin bilgilerini güncelle
        const closerId = interaction.user.id;
        
        // Eğer kullanıcı yoksa 0 olarak başlat
        if (!statsData[closerId]) {
          statsData[closerId] = 0;
        }
        
        // Kapatılan ticket sayısını artır
        statsData[closerId]++;
        
        // Dosyayı kaydet
        fs.writeFileSync(statsPath, JSON.stringify(statsData, null, 2));
        
        console.log(`✅ Ticket stats güncellendi: ${interaction.user.username} - ${statsData[closerId]} kapatılmış ticket`);
        
      } catch (error) {
        console.error('❌ Ticket stats güncellenirken hata:', error);
      }

      // Log kanalına gönderilecek embed
      const logEmbed = new EmbedBuilder()
        .setTitle(`Ticket Adı: ${ticketName}`)
        .setDescription(`> Ticket bilgileri aşağıda belirtilmiştir;\n**Ticket'ı kapatan yetkili:**\`\`\`yaml\n${interaction.user.username} - ${interaction.user.id}\n\`\`\`\n**Ticket sahibi:**\n\`\`\`yaml\n${ticketOwner ? ticketOwner.user.username : 'Bilinmiyor'} - ${ticketOwner ? ticketOwner.id : 'Bilinmiyor'}\n\`\`\`\n**Ticket açılma Sebebi:**\`\`\`yaml\n${ticketCategory}\n\`\`\`\n**Ticket açılma tarihi;**\n<t:${ticketOpenTime}:F> - <t:${ticketCloseTime}:F>`)
        .setColor('#a6cfdc')
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({
          text: 'Synatx Bot\'s | Log Sistemi. • bugün saat 12:12',
          iconURL: interaction.guild.iconURL()
        })
        .setTimestamp();

      // Ticket kapatılıyor embed'i
      const closingEmbed = new EmbedBuilder()
        .setTitle('🔒 Ticket Kapatılıyor')
        .setDescription('**Ticket 3 saniye içinde kapatılıyor...**')
        .setColor('#a6cfdc')
        .setTimestamp();

      // Önce kapatma mesajını gönder
      await interaction.reply({ embeds: [closingEmbed] });

      // 3 saniye bekle
      setTimeout(async () => {
        try {
          // Transcript oluştur
          const messages = await interaction.channel.messages.fetch({ limit: 100 });
          const sortedMessages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
          
          let transcript = `# TICKET TRANSCRIPT - ${ticketName}\n`;
          transcript += `**Kanal:** ${ticketName}\n`;
          transcript += `**Oluşturulma:** <t:${ticketOpenTime}:F>\n`;
          transcript += `**Kapatılma:** <t:${ticketCloseTime}:F>\n`;
          transcript += `**Ticket Sahibi:** ${ticketOwner ? ticketOwner.user.username : 'Bilinmiyor'} (${ticketOwner ? ticketOwner.id : 'Bilinmiyor'})\n`;
          transcript += `**Kapatılan Yetkili:** ${interaction.user.username} (${interaction.user.id})\n`;
          transcript += `**Kategori:** ${ticketCategory}\n\n`;
          transcript += `--- MESAJ GEÇMİŞİ ---\n\n`;

          for (const message of sortedMessages.values()) {
            const date = new Date(message.createdTimestamp).toLocaleString('tr-TR');
            transcript += `[${date}] ${message.author.username}: ${message.content}\n`;
            
            if (message.embeds.length > 0) {
              for (const embed of message.embeds) {
                if (embed.description) transcript += `[EMBED] ${embed.description}\n`;
                if (embed.title) transcript += `[EMBED TITLE] ${embed.title}\n`;
              }
            }
            
            if (message.attachments.size > 0) {
              for (const attachment of message.attachments.values()) {
                transcript += `[DOSYA] ${attachment.name} - ${attachment.url}\n`;
              }
            }
          }

          // HTML transcript oluştur
          const htmlTranscript = await createHTMLTranscript(interaction.channel);
          if (htmlTranscript) {
            const htmlBuffer = Buffer.from(htmlTranscript, 'utf8');
            const htmlAttachment = new AttachmentBuilder(htmlBuffer, { name: `ticket-transcript-${ticketName}.html` });

            // Log kanalına embed + HTML transcript gönder
            const logChannel = interaction.guild.channels.cache.get(config.logKanalId);
            if (logChannel) {
              await logChannel.send({ 
                embeds: [logEmbed],
                files: [htmlAttachment]
              });
            }
          } else {
            // HTML oluşturulamazsa sadece embed gönder
            const logChannel = interaction.guild.channels.cache.get(config.logKanalId);
            if (logChannel) {
              await logChannel.send({ 
                embeds: [logEmbed]
              });
            }
          }

          // Sonra kanalı sil
          await interaction.channel.delete();
        } catch (error) {
          console.error('Ticket kapatılırken hata:', error);
        }
      }, 3000);
    }

    // === OYUNCU KAPAT ===
    if (interaction.customId === 'oyuncu_kapat') {
      const ticketOwnerId = interaction.channel.topic;
      
      if (
        interaction.user.id !== ticketOwnerId &&
        !interaction.member.roles.cache.has(config.yetkiliRolId)
      ) {
        return interaction.reply({
          content: '❌ Bu butonu sadece ticket sahibi veya yetkililer kullanabilir.',
          ephemeral: true,
        });
      }

      await interaction.channel.permissionOverwrites.edit(ticketOwnerId, {
        ViewChannel: false,
      });

      const embed = new EmbedBuilder()
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
        .setDescription(`**<@${interaction.user.id}> adlı kişi destek talebini kapattı.**\n\n__**<@${ticketOwnerId}>**__ adlı kişi artık bu kanalı göremez!`)
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: 'Synatx Bot\'s | Ticket Sistemi.' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_reopen')
          .setLabel('Ticket\'i Geri Aç')
          .setStyle(ButtonStyle.Success)
      );

      await interaction.channel.send({ embeds: [embed], components: [row] });
      await interaction.deferUpdate();
    }

    // === TİCKET GERİ AÇ ===
    if (interaction.customId === 'ticket_reopen') {
      const ticketOwnerId = interaction.channel.topic;
      
      if (!interaction.member.roles.cache.has(config.yetkiliRolId)) {
        return interaction.reply({
          content: '❌ Bu butonu sadece yetkililer kullanabilir.',
          ephemeral: true,
        });
      }

      await interaction.channel.permissionOverwrites.edit(ticketOwnerId, {
        ViewChannel: true,
      });

      const embed = new EmbedBuilder()
        .setDescription(`**<@${interaction.user.id}> adlı kişi ticketi tekrar açtı!**\n\n__**<@${ticketOwnerId}>**__ adlı kişi artık bu kanalı görebilir!`)
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: 'Synatx Bot\'s | Ticket Sistemi.' })
        .setTimestamp();

      await interaction.channel.send({ embeds: [embed] });
      await interaction.deferUpdate();
    }
  },
};