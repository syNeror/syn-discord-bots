// deploy-commands.js
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const cfg = require('./config.json');

// --- Güvenlik kontrolleri
if (!cfg?.token || !cfg?.clientId) {
  console.error('<:13899754306013758771:1414619305445691473> config.json içinde token veya clientId eStik!');
  process.exit(1);
}

// --- Komutları topla (recursive)
const commandsDir = path.join(__dirname, 'commands');
if (!fs.existsSync(commandsDir)) {
  console.error('<:13899754306013758771:1414619305445691473> "commands" klasörü bulunamadı:', commandsDir);
  process.exit(1);
}

// Alt klasörleri de gezen küçük yardımcı
function walk(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.lstatSync(full);
    if (stat.isDirectory()) results = results.concat(walk(full));
    else if (entry.endsWith('.js')) results.push(full);
  }
  return results;
}

const files = walk(commandsDir);
if (files.length === 0) {
  console.warn('⚠️ "commands" altında .js komutu bulunamadı.');
}

const commands = [];
const nameToFiles = new Map();

for (const full of files) {
  const short = path.relative(commandsDir, full); // log için daha okunur
  try {
    const mod = require(full);

    if (!mod?.data || typeof mod.data?.toJSON !== 'function') {
      console.warn(`⚠️ ${short} içinde export edilen "data" veya "toJSON" yok. Atlaniyor.`);
      continue;
    }

    const json = mod.data.toJSON();
    if (!json?.name) {
      console.warn(`⚠️ ${short} -> Komut adı (data.name) bulunamadı. Atlaniyor.`);
      continue;
    }

    commands.push(json);

    const list = nameToFiles.get(json.name) || [];
    list.push(short);
    nameToFiles.set(json.name, list);
  } catch (e) {
    console.error(`<:13899754306013758771:1414619305445691473> ${short} yüklenirken hata:`, e);
  }
}

// --- Çift isim kontrolü
const dups = [...nameToFiles.entries()].filter(([, arr]) => arr.length > 1);
if (dups.length > 0) {
  console.error('<:13899754306013758771:1414619305445691473> ÇAKIŞAN KOMUT ADLARI TESPİT EDİLDİ. Deploy durduruldu.');
  for (const [name, arr] of dups) {
    console.error(` - "${name}" -> ${arr.join(', ')}`);
  }
  console.error('ℹ️ Aynı üst seviye komut adı birden fazla dosyada olamaz. İsimleri değiştirin veya alt komutlarla birleştirin.');
  process.exit(1);
}

// --- Log
console.log('📦 Yüklenecek komutlar:', commands.map(c => c.name).join(', ') || '(boş)');

// --- REST (v10) başlat
const rest = new REST({ version: '10' }).setToken(cfg.token);

// --- Deploy
(async () => {
  try {
    console.log('⏳ Slash komutları dağıtılıyor...');
    if (cfg.guildId && cfg.guildId.trim() !== '') {
      const route = Routes.applicationGuildCommands(cfg.clientId, cfg.guildId);
      const res = await rest.put(route, { body: commands });
      console.log(`✅ Guild komutları yüklendi. Toplam: ${Array.isArray(res) ? res.length : '?'} komut`);
    } else {
      const route = Routes.applicationCommands(cfg.clientId);
      const res = await rest.put(route, { body: commands });
      console.log(`✅ Global komutlar yüklendi. Toplam: ${Array.isArray(res) ? res.length : '?'} komut`);
      console.log('ℹ️ Global komutların yayına alınması Discord tarafında birkaç dakika sürebilir.');
    }
  } catch (e) {
    if (e?.rawError?.errors) {
      console.error('<:13899754306013758771:1414619305445691473> Deploy hatası (ayrıntı):', JSON.stringify(e.rawError.errors, null, 2));
    }
    console.error('<:13899754306013758771:1414619305445691473> Deploy hatası:', e);
    process.exit(1);
  }
})();
