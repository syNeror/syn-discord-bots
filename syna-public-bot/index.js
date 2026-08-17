const { Client, GatewayIntentBits, Collection, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

// Bot client oluştur
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Komutları yükle
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`✅ Komut yüklendi: ${command.data.name}`);
    } else {
        console.log(`⚠️  Komut yüklenemedi: ${filePath} - 'data' veya 'execute' özelliği eksik`);
    }
}

// Bot hazır olduğunda
client.once(Events.ClientReady, () => {
    console.log(`🤖 ${client.user.tag} olarak giriş yapıldı!`);
    console.log(`📊 ${client.guilds.cache.size} sunucuda aktif`);
    console.log(`🕐 Bot başlatıldı: ${new Date().toLocaleString()}`);
    
    // Durum döngüsü başlat
    startStatusCycle();
});

// Durum döngüsü fonksiyonu
function startStatusCycle() {
    let cycleStep = 0;
    
    const statusCycle = () => {
        console.log(`🔄 Durum döngüsü başlatıldı - Adım: ${cycleStep}`);
        switch(cycleStep) {
            case 0: // DND - X sunucuda oynuyor
                client.user.setPresence({
                    activities: [{
                        name: `${client.guilds.cache.size} Sunucuda`,
                        type: 0 // Playing
                    }],
                    status: 'dnd'
                });
                console.log(`🔴 DND durumu ayarlandı: ${client.guilds.cache.size} Sunucuda`);
                cycleStep = 1;
                setTimeout(statusCycle, 60000); // 60 saniye
                break;
                
            case 1: // Yayınlıyor - Synatx Bot's + Twitch linki
                client.user.setPresence({
                    activities: [{
                        name: 'Synatx Bot\'s',
                        type: 1, // Streaming
                        url: 'https://twitch.tv/Synatx'
                    }],
                    status: 'online'
                });
                console.log(`🟢 Yayınlıyor durumu ayarlandı: Synatx Bot's`);
                cycleStep = 0;
                setTimeout(statusCycle, 60000); // 60 saniye
                break;
        }
    };
    
    // İlk durumu ayarla
    statusCycle();
}

// Bot sunucuya eklendiğinde
client.on(Events.GuildCreate, async guild => {
    try {
        const owner = await guild.fetchOwner();
        
        // DM embed'i oluştur
        const embed = new EmbedBuilder()
            .setColor(0xadd8e6)
            .setTitle('Synatx Bot\'s')
            .setDescription(`__BU MESAJ SADECE SUNUCU SAHİBİNE GİDER__\n\n__${guild.name}__ Sunucusuna beni eklediğiniz için teşekkür ederim. Botu eğer sunucuya siz eklemediyseniz muhtemelen sunucunuzdaki bir yetkili eklemiştir. \`Diğer servislerimizden yararlanmak için butonları kullanabilirsiniz.\``)
            .setFooter({
                text: 'Synatx',
                icon_url: client.user.displayAvatarURL()
            })
            .setTimestamp();

        // Butonlar oluştur
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Synatx')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.gg/Synatx'),
                new ButtonBuilder()
                    .setLabel('Synatx.net')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://Synatx.net')
            );

        await owner.send({ embeds: [embed], components: [row] });
        console.log(`📤 Hoş geldin mesajı gönderildi: ${guild.name} - ${owner.user.tag}`);
        
    } catch (error) {
        console.error('❌ Hoş geldin mesajı hatası:', error);
    }
});

// Slash komutları işle
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`❌ Komut bulunamadı: ${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction);
        console.log(`✅ Komut çalıştırıldı: ${interaction.commandName} - ${interaction.user.tag}`);
    } catch (error) {
        console.error(`❌ Komut hatası: ${interaction.commandName}`, error);
        
        try {
            const errorMessage = {
                content: '❌ Bu komutu çalıştırırken bir hata oluştu!',
                ephemeral: true
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        } catch (replyError) {
            console.error('❌ Hata mesajı gönderilemedi:', replyError);
        }
    }
});

// Yeni üye katıldığında otomatik rol ver
client.on(Events.GuildMemberAdd, async member => {
    console.log(`🔔 Yeni üye katıldı: ${member.user.tag} - ${member.guild.name}`);
    
    try {
        // Her sunucu için ayrı ayar dosyası
        const autoRoleDataPath = `./autoRoleData_${member.guild.id}.json`;
        let autoRoleData;
        
        try {
            autoRoleData = require(autoRoleDataPath);
            console.log(`📁 Ayar dosyası yüklendi: ${autoRoleDataPath}`);
        } catch (error) {
            // Dosya yoksa varsayılan ayarlar
            autoRoleData = { enabled: false, roleId: null, channelId: null };
            console.log(`⚠️ Ayar dosyası bulunamadı: ${autoRoleDataPath}`);
        }
        
        console.log(`🔧 Otorol durumu: ${autoRoleData.enabled ? 'Aktif' : 'Pasif'}`);
        
        if (autoRoleData.enabled && autoRoleData.roleId && autoRoleData.channelId) {
            const role = member.guild.roles.cache.get(autoRoleData.roleId);
            const channel = member.guild.channels.cache.get(autoRoleData.channelId);
            
            if (role && channel) {
                console.log(`🎯 Rol bulundu: ${role.name} - Kanal bulundu: ${channel.name}`);
                
                // Role ver
                await member.roles.add(role);
                console.log(`✅ Rol verildi: ${member.user.tag} → ${role.name}`);
                
                // Sunucu üye sayısını al
                const memberCount = member.guild.memberCount;
                
                // Hoş geldin embed'i
                const embed = {
                    color: 0x006400,
                    title: 'Synatx Bot\'s',
                    url: 'https://kakashi.net',
                    description: `<:hs:1426713188912857209> ${member.user} Kullanıcısı Katıldı! ve **${memberCount}** Kişi Olduk!\nGerekli Rolleri Verdim. <:1189889128377106492:1426713431372861562>`,
                    footer: {
                        text: 'Synatx | Synatx.net',
                        icon_url: client.user.displayAvatarURL()
                    },
                    timestamp: new Date().toISOString()
                };
                
                await channel.send({ embeds: [embed] });
                console.log(`📤 Hoş geldin mesajı gönderildi: ${channel.name}`);
            } else {
                console.log(`❌ Rol veya kanal bulunamadı - Rol: ${role ? 'Var' : 'Yok'} - Kanal: ${channel ? 'Var' : 'Yok'}`);
            }
        }
    } catch (error) {
        console.error('❌ Otorol hatası:', error);
    }
});

// Üye ayrıldığında bildirim gönder
client.on(Events.GuildMemberRemove, async member => {
    console.log(`👋 Üye ayrıldı: ${member.user.tag} - ${member.guild.name}`);
    
    try {
        // Her sunucu için ayrı ayar dosyası
        const autoRoleDataPath = `./autoRoleData_${member.guild.id}.json`;
        let autoRoleData;
        
        try {
            autoRoleData = require(autoRoleDataPath);
            console.log(`📁 Ayar dosyası yüklendi: ${autoRoleDataPath}`);
        } catch (error) {
            // Dosya yoksa varsayılan ayarlar
            autoRoleData = { enabled: false, roleId: null, channelId: null };
            console.log(`⚠️ Ayar dosyası bulunamadı: ${autoRoleDataPath}`);
        }
        
        console.log(`🔧 Otorol durumu: ${autoRoleData.enabled ? 'Aktif' : 'Pasif'}`);
        
        if (autoRoleData.enabled && autoRoleData.channelId) {
            const channel = member.guild.channels.cache.get(autoRoleData.channelId);
            
            if (channel) {
                console.log(`🎯 Kanal bulundu: ${channel.name}`);
                
                // Sunucu üye sayısını al
                const memberCount = member.guild.memberCount;
                
                // Ayrılış embed'i
                const embed = {
                    color: 0x660000,
                    title: 'Synatx Bot\'s',
                    url: 'https://kakashi.net',
                    description: `<:hk:1426713187486793841> ${member.user} Kullanıcısı Ayrıldı! Senin Yüzünden **${memberCount}** Kişi Olduk!`,
                    footer: {
                        text: 'Synatx | Synatx.net',
                        icon_url: client.user.displayAvatarURL()
                    },
                    timestamp: new Date().toISOString()
                };
                
                await channel.send({ embeds: [embed] });
                console.log(`📤 Ayrılış bildirimi gönderildi: ${channel.name}`);
            } else {
                console.log(`❌ Kanal bulunamadı - Kanal ID: ${autoRoleData.channelId}`);
            }
        } else {
            console.log(`❌ Otorol pasif veya kanal ID yok - Aktif: ${autoRoleData.enabled} - Kanal ID: ${autoRoleData.channelId}`);
        }
    } catch (error) {
        console.error('❌ Ayrılış bildirimi hatası:', error);
    }
});

// Automod sistemi - Mesaj filtreleme
client.on(Events.MessageCreate, async message => {
    // Bot mesajlarını ve komutları yok say
    if (message.author.bot) return;
    if (message.content.startsWith('/')) return;
    
    try {
        // Her sunucu için ayrı ayar dosyası
        const automodDataPath = `./automodData_${message.guild.id}.json`;
        let automodData;
        
        try {
            automodData = require(automodDataPath);
        } catch (error) {
            // Dosya yoksa varsayılan ayarlar
            automodData = { link: false, kufur: false, special: false };
        }
        
        let shouldDelete = false;
        let reason = '';
        
        // Link filtresi
        if (automodData.link) {
            const linkRegex = /(https?:\/\/[^\s]+|discord\.gg\/[^\s]+|discordapp\.com\/[^\s]+)/gi;
            if (linkRegex.test(message.content)) {
                shouldDelete = true;
                reason = 'Link paylaşımı yasak!';
            }
        }
        
        // Küfür filtresi
        if (automodData.kufur) {
            const kufurWords = [
                'allah', 'allahını', 'allahınıskm', 'sikm', 'sikeiym', 'orosbucocug',
                'sik', 'sikeyim', 'amk', 'aq', 'orospu', 'piç', 'göt', 'bok',
                'yarrak', 'sikik', 'amına', 'götüne', 'sikine', 'yarrağına'
            ];
            
            const messageLower = message.content.toLowerCase();
            for (const word of kufurWords) {
                if (messageLower.includes(word)) {
                    shouldDelete = true;
                    reason = 'Küfür kullanımı yasak!';
                    break;
                }
            }
        }
        
        // Synatx Special filtresi (hem link hem küfür)
        if (automodData.special) {
            const linkRegex = /(https?:\/\/[^\s]+|discord\.gg\/[^\s]+|discordapp\.com\/[^\s]+)/gi;
            const kufurWords = [
                'allah', 'allahını', 'allahınıskm', 'sikm', 'sikeiym', 'orosbucocug',
                'sik', 'sikeyim', 'amk', 'aq', 'orospu', 'piç', 'göt', 'bok',
                'yarrak', 'sikik', 'amına', 'götüne', 'sikine', 'yarrağına'
            ];
            
            const messageLower = message.content.toLowerCase();
            let hasLink = linkRegex.test(message.content);
            let hasKufur = false;
            
            for (const word of kufurWords) {
                if (messageLower.includes(word)) {
                    hasKufur = true;
                    break;
                }
            }
            
            if (hasLink || hasKufur) {
                shouldDelete = true;
                reason = 'Link ve küfür kullanımı yasak!';
            }
        }
        
        // Mesajı sil
        if (shouldDelete) {
            await message.delete();
            
            // Uyarı mesajı gönder
            const warningEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('⚠️ Mesaj Silindi')
                .setDescription(`${message.author}, mesajınız silindi!\n**Sebep:** ${reason}`)
                .setFooter({
                    text: 'Synatx Automod Sistemi',
                    icon_url: client.user.displayAvatarURL()
                })
                .setTimestamp();
                
            await message.channel.send({ embeds: [warningEmbed] });
            
            console.log(`🗑️ Mesaj silindi: ${message.author.tag} - ${reason}`);
        }
        
    } catch (error) {
        console.error('❌ Automod hatası:', error);
    }
});

// Bot'u başlat
client.login(config.token);
