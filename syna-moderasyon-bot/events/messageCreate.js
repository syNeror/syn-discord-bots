const { EmbedBuilder, Colors } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const STATS_PATH = path.join(DATA_DIR, 'userStats.json');
const LOG_PATH = path.join(__dirname, '..', 'log.json');

// Level system configuration
const LEVEL_CONFIG = {
  messagesPerLevel: 10, // Her level için 10 mesaj daha
  maxLevel: 100
};

function readJSON(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJSON(filePath, data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('JSON yazma hatası:', error);
  }
}

function calculateLevel(messages) {
  // 1 level = 10 mesaj, 2 level = 30 mesaj, 3 level = 60 mesaj
  // Formül: level = sqrt(messages/5) veya daha basit: her 10 mesajda 1 level
  let level = 0;
  let requiredMessages = 0;
  
  while (requiredMessages <= messages) {
    level++;
    requiredMessages += level * LEVEL_CONFIG.messagesPerLevel;
  }
  
  return Math.max(0, level - 1);
}

async function createLevelUpVisual(user, oldLevel, newLevel) {
  const { AttachmentBuilder } = require('discord.js');
  const { createCanvas, loadImage } = require('canvas');
  const path = require('path');
  
  // 1. ve 2. görseldeki gibi bire bir aynı boyutlar
  const canvas = createCanvas(500, 80);
  const ctx = canvas.getContext('2d');
  
  // Koyu arka plan (1. ve 2. görseldeki gibi)
  ctx.fillStyle = '#1A1A1A';
  ctx.fillRect(0, 0, 500, 80);
  
  // Yuvarlak köşeler
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.roundRect(0, 0, 500, 80, 10);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  
  // Glow efekti için border
  ctx.strokeStyle = '#00BFFF';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00BFFF';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.roundRect(1, 1, 498, 78, 10);
  ctx.stroke();
  ctx.shadowBlur = 0;
  
  // Kullanıcı avatar'ı (sol tarafta, yuvarlak)
  try {
    const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 60 }));
    ctx.save();
    ctx.beginPath();
    ctx.arc(40, 40, 25, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, 15, 15, 50, 50);
    ctx.restore();
    
    // Avatar glow efekti
    ctx.strokeStyle = '#00BFFF';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00BFFF';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(40, 40, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  } catch (error) {
    console.error('Avatar yükleme hatası:', error);
  }
  
  // Kullanıcı adı (ALVARVFX gibi büyük, beyaz, kalın)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(user.username.toUpperCase(), 80, 50);
  
  // Level progression (1. ve 2. görseldeki gibi)
  const centerX = 350;
  const centerY = 40;
  
  // Sol daire (eski level) - glow efekti ile
  ctx.fillStyle = '#00BFFF';
  ctx.shadowColor = '#00BFFF';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(centerX - 30, centerY, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(oldLevel.toString(), centerX - 30, centerY + 5);
  
  // Ok (glow efekti ile)
  ctx.fillStyle = '#00BFFF';
  ctx.shadowColor = '#00BFFF';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(centerX - 8, centerY - 6);
  ctx.lineTo(centerX + 2, centerY);
  ctx.lineTo(centerX - 8, centerY + 6);
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // Sağ daire (yeni level) - glow efekti ile
  ctx.fillStyle = '#00BFFF';
  ctx.shadowColor = '#00BFFF';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(centerX + 30, centerY, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(newLevel.toString(), centerX + 30, centerY + 5);
  
  // Canvas'ı attachment olarak döndür
  const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'levelup.png' });
  
  return {
    content: '🎉 Level Atladın!',
    files: [attachment]
  };
}

function readLogConfig() {
  try {
    if (!fs.existsSync(LOG_PATH)) return {};
    return JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'));
  } catch {
    return {};
  }
}

module.exports = {
  name: 'messageCreate',
  
  async execute(message, client) {
    // Bot mesajlarını ve komutları yok say
    if (message.author.bot) return;
    if (message.content.startsWith('/')) return;

    try {
      // Kullanıcı verilerini oku
      const statsData = readJSON(STATS_PATH, {});
      const userId = message.author.id;
      
      // Kullanıcı verilerini güncelle
      if (!statsData[userId]) {
        statsData[userId] = {
          username: message.author.username,
          messages: 0,
          level: 0,
          lastLevelUp: null
        };
      }

      // Eski level'ı kaydet
      const oldLevel = calculateLevel(statsData[userId].messages);
      
      // Mesaj sayısını artır
      statsData[userId].messages += 1;
      statsData[userId].username = message.author.username; // Kullanıcı adını güncelle
      
      // Yeni level'ı hesapla
      const newLevel = calculateLevel(statsData[userId].messages);
      
      // Level atlama kontrolü
      if (newLevel > oldLevel && newLevel > 0) {
        statsData[userId].level = newLevel;
        statsData[userId].lastLevelUp = new Date().toISOString();
        
        // Level up görseli oluştur
        const levelUpVisual = await createLevelUpVisual(message.author, oldLevel, newLevel);
        
        // Sadece log kanalına gönder
        try {
          const logConfig = readLogConfig();
          const rankLogChannelId = logConfig['Strank-log'];
          
          if (rankLogChannelId) {
            const rankLogChannel = message.guild.channels.cache.get(rankLogChannelId);
            if (rankLogChannel) {
              await rankLogChannel.send(levelUpVisual);
            }
          }
        } catch (error) {
          console.error('Level up log gönderme hatası:', error);
        }
      }

      // Verileri kaydet
      writeJSON(STATS_PATH, statsData);

    } catch (error) {
      console.error('Mesaj takip hatası:', error);
    }
  },
};
