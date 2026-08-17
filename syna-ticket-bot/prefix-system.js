// Bu kodu başka botunun index.js dosyasına ekle

// 1. Collection ekle (client.commands = new Collection(); satırından sonra)
client.prefixCommands = new Collection();

// 2. Komut yükleme kısmını değiştir (mevcut for döngüsünü bu ile değiştir)
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  // Slash komutları
  if (command?.data?.name && typeof command.execute === "function") {
    client.commands.set(command.data.name, command);
    console.log(`✅ Slash komut yüklendi: ${command.data.name}`);
  }
  // Prefix komutları
  else if (command?.name && typeof command.execute === "function") {
    client.prefixCommands.set(command.name, command);
    console.log(`✅ Prefix komut yüklendi: ${command.name}`);
  } else {
    console.warn(`[WARN] ${file} -> "data.name" veya "name" veya "execute" eksik olabilir.`);
  }
}

// 3. MessageCreate event handler ekle (bot.login() satırından önce)
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('.')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.prefixCommands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args, client);
  } catch (error) {
    console.error(`Prefix komut hatası (${commandName}):`, error);
    message.reply('Komutta bir hata oluştu!').catch(() => {});
  }
});
