const { SlashCommandBuilder, EmbedBuilder, Colors, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

// JSON dosyalarını okuma fonStiyonu
function readJSON(filePath, defaultValue = {}) {
  try {
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return defaultValue;
  } catch (error) {
    console.error(`JSON okuma hatası (${filePath}):`, error);
    return defaultValue;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-top')
    .setDescription('Ticket sıralamasını gösterir'),

  async execute(interaction, client) {
    try {
      // Ticket verilerini oku (staffClaims.json'dan)
      const ticketData = readJSON('./data/staffClaims.json', {});
      
      // Kullanıcı verilerini işle ve sırala (staffClaims.json formatı)
      const userStats = [];
      
      for (const [userId, tickets] of Object.entries(ticketData)) {
        try {
          const user = await interaction.client.users.fetch(userId);
          userStats.push({
            userId,
            tickets: tickets || 0,
            username: user.username
          });
        } catch (error) {
          console.error(`Kullanıcı fetch hatası (${userId}):`, error);
          userStats.push({
            userId,
            tickets: tickets || 0,
            username: 'Bilinmeyen Kullanıcı'
          });
        }
      }
      
      // Sırala ve ilk 10'u al
      userStats.sort((a, b) => b.tickets - a.tickets).slice(0, 10);

      // Text sıralama
      let rankingText = '';
      if (userStats.length > 0) {
        rankingText = userStats.map((user, index) => {
          const rank = index + 1;
          const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🎫';
          return `${rank}. ${rankEmoji} <@${user.userId}> • ${user.tickets} ticket`;
        }).join('\n');
      } else {
        rankingText = 'Henüz ticket verisi bulunmuyor.';
      }

      // Görsel leaderboard oluştur
      const leaderboardImage = await createTicketLeaderboard(userStats.slice(0, 5), interaction.guild, interaction.client);
      
      // Aynı embedde hem text hem görsel
      const combinedEmbed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle('🏆 Toplam Ticket Sıralaması')
        .setDescription(rankingText)
        .setImage('attachment://leaderboard.png')
        .setFooter({ 
          text: `${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')} • ${interaction.guild.name} • Top 5` 
        })
        .setTimestamp();

      await interaction.reply({ 
        embeds: [combinedEmbed], 
        files: [leaderboardImage] 
      });

    } catch (error) {
      console.error('Ticket-top komut hatası:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ 
          content: 'Komutta bir hata oluştu.', 
          ephemeral: true 
        });
      } else {
        await interaction.followUp({ 
          content: 'Komutta bir hata oluştu.', 
          ephemeral: true 
        });
      }
    }
  }
};

async function createTicketLeaderboard(topUsers, guild, client) {
  const { AttachmentBuilder } = require('discord.js');
  const { createCanvas, loadImage, registerFont } = require('canvas');
  const path = require('path');

  // Fontu kaydet
  registerFont(path.join(__dirname, '../assets/fonts/Gilroy-Bold.ttf'), { family: 'Gilroy' });

  const canvas = createCanvas(1000, 750);
  const ctx = canvas.getContext('2d');

  // Arka plan (gridli koyu mavi)
  ctx.fillStyle = '#02142c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#0d2e4e';
  ctx.lineWidth = 1;
  for (let i = 0; i < canvas.width; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
    ctx.stroke();
  }
  for (let i = 0; i < canvas.height; i += 40) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i);
    ctx.stroke();
  }

  // Sol üst sunucu logosu
  try {
    const logo = await loadImage(guild.iconURL({ extension: 'png', size: 128 }));
    ctx.save();
    ctx.beginPath();
    ctx.arc(80, 80, 45, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logo, 35, 35, 90, 90);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(80, 80, 45, 0, Math.PI * 2);
    ctx.strokeStyle = '#1a4068';
    ctx.lineWidth = 3;
    ctx.stroke();
  } catch {}

  // Kullanıcı sınırı
  const maxUsers = 5;

  // Ana kutu (başlık + kullanıcılar dahil)
  const containerX = 100;
  const containerY = 180;
  const containerWidth = 800;
  const rowHeight = 60;
  const spacing = 10;
  const visibleRows = Math.min(topUsers.length, maxUsers);
  const containerHeight = 60 + spacing + (rowHeight + spacing) * maxUsers + 20;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.strokeStyle = '#1a4068';
  ctx.lineWidth = 2;
  ctx.roundRect(containerX, containerY, containerWidth, containerHeight, 14);
  ctx.fill();
  ctx.stroke();

  // Başlık metni
  ctx.font = 'bold 32px Gilroy';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('Toplam Ticket Sıralaması', canvas.width / 2, containerY + 40);

  // Eğer kullanıcı yoSta "no data"
  if (topUsers.length === 0) {
    ctx.font = 'bold 26px Gilroy';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('No data available', canvas.width / 2, containerY + 130);
  }

  // Kullanıcı satırları
  const startY = containerY + 70;
  const leftX = containerX + 10;
  const rightX = containerX + containerWidth - 10;

  for (let i = 0; i < Math.min(topUsers.length, maxUsers); i++) {
    const user = topUsers[i];
    const y = startY + i * (rowHeight + spacing);

      // 2. görseldeki gibi düz arka plan
      ctx.fillStyle = '#0f2233';
      ctx.roundRect(leftX, y, rightX - leftX, rowHeight, 10);
      ctx.fill();
     
     // 2. görseldeki gibi çerçeve - tüm sıralar aynı renk
     ctx.strokeStyle = '#FFD700'; // Hep altın rengi
     ctx.lineWidth = 2;
     ctx.roundRect(leftX, y, rightX - leftX, rowHeight, 10);
     ctx.stroke();

    // Sıra numarası (daire) - 2. görseldeki gibi
    ctx.beginPath();
    ctx.arc(leftX + 30, y + rowHeight / 2, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700'; // Hep altın rengi
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px Gilroy';
    ctx.textAlign = 'center';
    ctx.fillText((i + 1).toString(), leftX + 30, y + rowHeight / 2 + 6);

    // Avatar (discord pfp) - 2. görseldeki gibi
    try {
      const u = await client.users.fetch(user.userId);
      const avatar = await loadImage(u.displayAvatarURL({ extension: 'png', size: 128 }));
      ctx.save();
      ctx.beginPath();
      ctx.arc(leftX + 75, y + rowHeight / 2, 18, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatar, leftX + 57, y + rowHeight / 2 - 18, 36, 36);
      ctx.restore();
      
      // Avatar border - 2. görseldeki gibi altın
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(leftX + 75, y + rowHeight / 2, 18, 0, Math.PI * 2);
      ctx.stroke();
    } catch {}

    // İsim - altın renk
    ctx.font = 'bold 18px Gilroy';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'left';
    ctx.fillText(user.username.slice(0, 15), leftX + 110, y + rowHeight / 2 + 6);

    // Ticket sayısı - altın renk
    ctx.font = 'bold 20px Gilroy';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'right';
    ctx.fillText(user.tickets.toString(), rightX - 60, y + rowHeight / 2 + 6);

    // "ticket" yazısı - altın renk
    ctx.font = 'italic 16px Gilroy';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'left';
    ctx.fillText('ticket', rightX - 50, y + rowHeight / 2 + 6);
  }

  // Alt bilgi
  const now = new Date();
  ctx.fillStyle = '#c0c0c0';
  ctx.font = '14px Gilroy';
  ctx.textAlign = 'center';
  ctx.fillText(`${now.toLocaleDateString('tr-TR')} ${now.toLocaleTimeString('tr-TR')} • ${guild.name} • Top 5`, canvas.width / 2, canvas.height - 30);

  return new AttachmentBuilder(canvas.toBuffer(), { name: 'leaderboard.png' });
}


