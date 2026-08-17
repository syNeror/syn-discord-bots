const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  try {
    const command = require(`./commands/${file}`);
    
    // Komut dosyasının data property'sine sahip olup olmadığını kontrol et
    if (command.data && typeof command.data.toJSON === 'function') {
      commands.push(command.data.toJSON());
      console.log(`✅ ${file} komutu yüklendi`);
    } else {
      console.log(`⚠️ ${file} dosyasında 'data' property'si bulunamadı veya geçersiz`);
    }
  } catch (error) {
    console.error(`❌ ${file} dosyası yüklenirken hata oluştu:`, error.message);
  }
}

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log(`⏳ ${commands.length} adet slash komutu yükleniyor...`);
    
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands },
    );
    
    console.log(`✅ ${commands.length} adet slash komutu başarıyla yüklendi!`);
  } catch (error) {
    console.error('❌ Slash komutları yüklenirken hata:', error);
  }
})();