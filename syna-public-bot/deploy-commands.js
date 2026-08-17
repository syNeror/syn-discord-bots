const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

const commands = [];

// Commands klasöründeki tüm komutları yükle
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        console.log(`✅ Komut yüklendi: ${command.data.name}`);
    } else {
        console.log(`⚠️  Komut yüklenemedi: ${filePath} - 'data' veya 'execute' özelliği eksik`);
    }
}

// REST instance oluştur
const rest = new REST().setToken(config.token);

// Komutları deploy et
(async () => {
    try {
        console.log(`🔄 ${commands.length} adet slash komut yükleniyor...`);

        // Global komutlar için
        const data = await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands },
        );

        console.log(`✅ ${data.length} adet slash komut başarıyla yüklendi!`);
        
        // Komut listesini göster
        commands.forEach(cmd => {
            console.log(`  - /${cmd.name}`);
        });
        
    } catch (error) {
        console.error('❌ Komut yükleme hatası:', error);
    }
})();
