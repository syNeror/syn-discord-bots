const { 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder, 
  PermissionFlagsBits,
  AttachmentBuilder
} = require('discord.js');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket sistemi komutları')
    .addSubcommand(subcommand =>
      subcommand
        .setName('panel')
        .setDescription('Ticket oluşturma panelini gönderir')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('isim')
        .setDescription('Ticket kanalının ismini değiştirir')
        .addStringOption(option =>
          option.setName('yeni_isim')
            .setDescription('Yeni kanal ismi (ID sabit kalacak)')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('ekle')
        .setDescription('Bir kullanıcıyı ticket kanalına ekler')
        .addUserOption(option =>
          option.setName('kullanici')
            .setDescription('Eklemek istediğin kullanıcı')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('çıkar')
        .setDescription('Belirtilen kullanıcıyı ticket kanalından çıkarır')
        .addUserOption(option =>
          option.setName('kullanici')
            .setDescription('Kanaldan çıkarılacak kullanıcı')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('top')
        .setDescription('Ticket sıralamasını görsel olarak gösterir')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    // === TICKET PANEL ===
    if (subcommand === 'panel') {
      const svname = interaction.guild.name;
      const embed = new EmbedBuilder()
        .setDescription('<:1149250145154781287:1391554562392850432>・`Ticket System`: <:yeilnokta:1391552129789067335> \n <:1146375638941450250:1391554584039919626>・`Guild Rules:` <#1426347104728514712>')
        .setAuthor({name: `${svname}`,iconURL: interaction.guild.iconURL({ dynamic: true }) || ""})
        .setImage('')
        .setThumbnail("")
        .setColor('#444444');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('create_ticket')
          .setLabel('Ticket Oluştur')
          .setEmoji('<a:emote_coin:1391552179214749858>')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('price_info')
          .setLabel('Fiyat bilgisi almak istiyorum')
          .setEmoji('<a:1373052121213308969:1391552489983053935>')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('partner')
          .setLabel('Partnerlik')
          .setEmoji('<a:higif:1391552083961970888>')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({ embeds: [embed], components: [row] });
    }

    // === TICKET İSİM ===
    if (subcommand === 'isim') {
      const newName = interaction.options.getString('yeni_isim');
      const channel = interaction.channel;

      // ✅ Ticket kanalı kontrolü - ticket veya satın alanlar kategorisinde olup olmadığını kontrol et
      const isTicketCategory = channel.parentId === config.ticketCategoryId;
      const isSatinAlanlarCategory = channel.parentId === config.satinAlanlarCategoryId;
      
      if (channel.type !== 0 || (!isTicketCategory && !isSatinAlanlarCategory)) {
        return interaction.reply({
          content: '❌ Bu komut sadece ticket veya satın alanlar kanallarında kullanılabilir.',
          ephemeral: true
        });
      }

      // 🔐 SADECE ownerRoleID rolüne sahip olanlar kullanabilir
      if (!interaction.member.roles.cache.has(config.yetkiliRolId)) {
        return interaction.reply({
          content: '❌ Bu komutu çalıştırmak için izniniz yok!',
          ephemeral: true
        });
      }

      // 🎯 Kanal ismini direkt değiştir (ID korunmuyor)
      try {
        await channel.setName(newName);
        
        // Unix timestamp oluştur
        const timestamp = Math.floor(Date.now() / 1000);
        
        // Log embed'i oluştur
        const logEmbed = new EmbedBuilder()
          .setDescription(`> Destek talebi kanalının ismi değiştirildi.\n\n**Ticketin Yeni İsmi:**\n\`${newName}\`\n**Yapan Yetkili:**\n<@${interaction.user.id}> - ${interaction.user.id}\n**Zaman:**\n<t:${timestamp}:F> (<t:${timestamp}:R>)`)
          .setColor('#a6cfdc')
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setThumbnail(interaction.user.displayAvatarURL())
          .setFooter({
            text: `${interaction.user.username} tarafından istendi.`,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setTimestamp();

        // Transcript oluştur
        try {
          const messages = await channel.messages.fetch({ limit: 100 });
          const sortedMessages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
          
          let transcript = `# TICKET TRANSCRIPT - ${channel.name}\n`;
          transcript += `**Kanal:** ${channel.name}\n`;
          transcript += `**Oluşturulma:** <t:${Math.floor(channel.createdTimestamp / 1000)}:F>\n`;
          transcript += `**İsim Değiştiren:** ${interaction.user.username} (${interaction.user.id})\n`;
          transcript += `**Yeni İsim:** ${newName}\n`;
          transcript += `**Zaman:** <t:${timestamp}:F>\n\n`;
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

          // TXT dosyası oluştur
          const buffer = Buffer.from(transcript, 'utf8');
          const attachment = new AttachmentBuilder(buffer, { name: `ticket-transcript-${channel.name}.txt` });

          // Ticket kanalına sadece embed gönder
          await interaction.reply({
            embeds: [logEmbed]
          });

          // Sadece ticket log kanalına embed gönder (TXT gönderme)
          const ticketLogChannel = interaction.guild.channels.cache.find(
            channel => channel.name === '🎫┆ksticket-log'
          );
          if (ticketLogChannel) {
            await ticketLogChannel.send({
              embeds: [logEmbed]
            });
          }
        } catch (error) {
          console.error('Transcript oluşturulurken hata:', error);
          await interaction.reply({
            embeds: [logEmbed]
          });
          
          // Hata durumunda da log kanalına gönder
          const logChannel = interaction.guild.channels.cache.get(config.logKanalId);
          if (logChannel) {
            await logChannel.send({
              embeds: [logEmbed]
            });
          }
        }
      } catch (err) {
        console.error(err);
        return interaction.reply({
          content: '❌ Kanal ismi değiştirilirken bir hata oluştu.',
          ephemeral: true
        });
      }
    }

    // === TICKET EKLE ===
    if (subcommand === 'ekle') {
      const channel = interaction.channel;
      const memberToAdd = interaction.options.getUser('kullanici');

      // ✅ Ticket kanalı kontrolü - ticket veya satın alanlar kategorisinde olup olmadığını kontrol et
      const isTicketCategory = channel.parentId === config.ticketCategoryId;
      const isSatinAlanlarCategory = channel.parentId === config.satinAlanlarCategoryId;
      
      if (channel.type !== 0 || (!isTicketCategory && !isSatinAlanlarCategory)) {
        return interaction.reply({
          content: '❌ Bu komut sadece ticket veya satın alanlar kanallarında kullanılabilir.',
          ephemeral: true
        });
      }

      // 🔐 SADECE ownerRoleID rolüne sahip olanlar kullanabilir
      if (!interaction.member.roles.cache.has(config.yetkiliRolId)) {
        return interaction.reply({
          content: '❌ Bu komutu çalıştırmak için izniniz yok!',
          ephemeral: true
        });
      }

      try {
        // Kullanıcıya kanal görme izinlerini ver
        await channel.permissionOverwrites.edit(memberToAdd.id, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true
        });

        // Unix timestamp oluştur
        const timestamp = Math.floor(Date.now() / 1000);
        
        // Log embed'i oluştur
        const logEmbed = new EmbedBuilder()
        .setTitle("Ticket'a Kişi eklendi")
          .setDescription(`> Destek talebi kanalına Kişi Eklendi\n\n**Eklenen Kullanıcı:**\n<@${memberToAdd.id}> - ${memberToAdd.id}\n**Ekleyen Yetkili:**\n<@${interaction.user.id}> - ${interaction.user.id}\n**Zaman:**\n<t:${timestamp}:F> (<t:${timestamp}:R>)`)
          .setColor('#a6cfdc')
          .setThumbnail(interaction.user.displayAvatarURL())
          .setFooter({
            text: `${interaction.user.username} tarafından istendi.`,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setTimestamp();

        // Ticket kanalına log embed'i yanıt olarak gönder
        await interaction.reply({
          embeds: [logEmbed]
        });

        // Yetkili log kanalına da gönder
        const yetkiliLogChannel = interaction.guild.channels.cache.find(
          channel => channel.name === '🎫┆ksticket-yetkili-log'
        );
        if (yetkiliLogChannel) {
          await yetkiliLogChannel.send({
            embeds: [logEmbed]
          });
        }
      } catch (error) {
        console.error(error);
        return interaction.reply({
          content: '❌ Kullanıcı eklenirken bir hata oluştu.',
          ephemeral: true
        });
      }
    }

    // === TICKET ÇIKAR ===
    if (subcommand === 'çıkar') {
      const channel = interaction.channel;
      const memberToRemove = interaction.options.getUser('kullanici');

      // ✅ Ticket kanalı kontrolü - ticket veya satın alanlar kategorisinde olup olmadığını kontrol et
      const isTicketCategory = channel.parentId === config.ticketCategoryId;
      const isSatinAlanlarCategory = channel.parentId === config.satinAlanlarCategoryId;
      
      if (channel.type !== 0 || (!isTicketCategory && !isSatinAlanlarCategory)) {
        return interaction.reply({
          content: '❌ Bu komut sadece ticket veya satın alanlar kanallarında kullanılabilir.',
          ephemeral: true
        });
      }

      // 🔐 Sadece ownerRoleID olanlar kullanabilir
      if (!interaction.member.roles.cache.has(config.yetkiliRolId)) {
        return interaction.reply({
          content: '❌ Bu komutu çalıştırmak için izniniz yok!',
          ephemeral: true
        });
      }

      try {
        // Kullanıcıyı ticket'tan çıkar (izinlerini sil)
        await channel.permissionOverwrites.delete(memberToRemove.id);

        // Unix timestamp oluştur
        const timestamp = Math.floor(Date.now() / 1000);
        
        // Log embed'i oluştur
        const logEmbed = new EmbedBuilder()
          .setTitle("Ticket'dan Kişi Çıkarıldı")
          .setDescription(`> Destek talebi kanalından Kişi Çıkarıldı\n\n**Çıkarılan Kullanıcı:**\n<@${memberToRemove.id}> - ${memberToRemove.id}\n**Çıkaran Yetkili:**\n<@${interaction.user.id}> - ${interaction.user.id}\n**Zaman:**\n<t:${timestamp}:F> (<t:${timestamp}:R>)`)
          .setColor('#a6cfdc')
          .setThumbnail(interaction.user.displayAvatarURL())
          .setFooter({
            text: `${interaction.user.username} tarafından istendi.`,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setTimestamp();

        // Ticket kanalına log embed'i yanıt olarak gönder
        await interaction.reply({
          embeds: [logEmbed]
        });

        // Yetkili log kanalına da gönder
        const yetkiliLogChannel = interaction.guild.channels.cache.find(
          channel => channel.name === '🎫┆ksticket-yetkili-log'
        );
        if (yetkiliLogChannel) {
          await yetkiliLogChannel.send({
            embeds: [logEmbed]
          });
        }
      } catch (error) {
        console.error(error);
        return interaction.reply({
          content: '❌ Kullanıcı çıkarılırken bir hata oluştu.',
          ephemeral: true
        });
      }
    }

    // === TICKET TOP ===
    if (subcommand === 'top') {
      // 🔐 Sadece owner rolüne sahip kullanıcılar kullanabilir
      if (!interaction.member.roles.cache.has(config.yetkiliRolId)) {
        return interaction.reply({
          content: '❌ Bu komutu sadece owner rolüne sahip olanlar kullanabilir.',
          ephemeral: true
        });
      }

      // ⚠️ İşlem uzun sürebilir, Discord'a "işleniyor" bilgisi gönder
      await interaction.deferReply();

      const rawData = fs.readFileSync('./ticketStats.json');
      const stats = JSON.parse(rawData);

      const sorted = Object.entries(stats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      const users = await Promise.all(
        Array.from({ length: 10 }).map(async (_, i) => {
          const entry = sorted[i];
          if (!entry) {
            return {
              username: 'No Data',
              avatarURL: 'https://cdn.discordapp.com/embed/avatars/0.png',
              tickets: 0
            };
          }

          const [userID, ticketCount] = entry;
          try {
            const user = await interaction.client.users.fetch(userID);
            return {
              username: user.username,
              avatarURL: user.displayAvatarURL({ extension: 'png', size: 64 }),
              tickets: ticketCount
            };
          } catch {
            return {
              username: 'Unknown',
              avatarURL: 'https://cdn.discordapp.com/embed/avatars/0.png',
              tickets: ticketCount
            };
          }
        })
      );

      // 🎨 Görsel çizimi
      const backgroundColor = '#1e1f22';
      const separatorColor = '#2b2d31';

      const width = 500;
      const rowHeight = 48;
      const height = rowHeight * 10;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const y = i * rowHeight;

        ctx.fillStyle = separatorColor;
        ctx.fillRect(0, y + rowHeight - 1, width, 1);

        const avatar = await loadImage(user.avatarURL);
        ctx.save();
        const x = 4;
        const yPos = y + 4;
        const size = 40;
        const radius = 6;

        ctx.beginPath();
        ctx.moveTo(x + radius, yPos);
        ctx.lineTo(x + size - radius, yPos);
        ctx.quadraticCurveTo(x + size, yPos, x + size, yPos + radius);
        ctx.lineTo(x + size, yPos + size - radius);
        ctx.quadraticCurveTo(x + size, yPos + size, x + size - radius, yPos + size);
        ctx.lineTo(x + radius, yPos + size);
        ctx.quadraticCurveTo(x, yPos + size, x, yPos + size - radius);
        ctx.lineTo(x, yPos + radius);
        ctx.quadraticCurveTo(x, yPos, x + radius, yPos);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, x, yPos, size, size);
        ctx.restore();

        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 16px sans-serif';
        ctx.fillText(user.username, 56, y + 30);

        ctx.font = '600 14px sans-serif';
        ctx.fillText(`Ticket: ${user.tickets}`, 300, y + 30);

        let rankColor = '#ffffff';
        if (i === 0) rankColor = '#FFD700';
        else if (i === 1) rankColor = '#C0C0C0';
        else if (i === 2) rankColor = '#CD7F32';

        ctx.fillStyle = rankColor;
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`#${i + 1}`, 440, y + 30);

        ctx.shadowColor = 'transparent';
      }

      const buffer = canvas.toBuffer('image/png');
      const attachment = new AttachmentBuilder(buffer, { name: 'ticket-top.png' });

      // ✅ deferReply kullanıldığı için artık editReply yapıyoruz
      await interaction.editReply({
        files: [attachment]
      });
    }
  },
};
