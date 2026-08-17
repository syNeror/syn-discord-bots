const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const config = require("./config.json");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

/* -------------------- Komutları yükle -------------------- */
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if (command?.data?.name && typeof command.execute === "function") {
    client.commands.set(command.data.name, command);
    console.log(`✅ Komut yüklendi: ${command.data.name}`);
  } else {
    console.warn(`[WARN] ${file} -> "data.name" veya "execute" eStik olabilir.`);
  }
}

/* -------------------- Eventleri yükle -------------------- */
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  console.log(`📂 Event yüklendi: ${event.name}`);
}


/* -------------------- Botu başlat -------------------- */
client.login(config.token).catch(err => {
  console.error("<:13899754306013758771:1414619305445691473> Bot token ile giriş yapılamadı:", err);
});
