// events/logGuard.js
// Amaç: Log kanallarına atılan embed mesajları silinirse, BOT aynı embed'i hemen yeniden atsın.
// Tek dosya ile çalışır; diğer log kodlarına dokunmana gerek yok.

const {
  Events,
  ComponentType,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const log = require('../log.json'); // Tüm log kanal ID'lerin burada (örn: Stban-log, Stsecurity-log, Stgiris-log, Stisim-log ...)

const STORE = path.join(__dirname, '..', 'logStore.json');
// STORE yapısı: { "messages": { "<messageId>": { "channelId": "123", "content": "...", "embeds": [...], "components": [...] } } }

function loadStore() {
  try {
    if (!fs.existsSync(STORE)) return { messages: {} };
    return JSON.parse(fs.readFileSync(STORE, 'utf8'));
  } catch {
    return { messages: {} };
  }
}
function saveStore(data) {
  try {
    fs.writeFileSync(STORE, JSON.stringify(data, null, 2));
  } catch {}
}

// log.json içindeki tüm kanal ID’lerini tek sette topla
function collectLogChannelIds() {
  const ids = new Set();
  for (const k of Object.keys(log || {})) {
    const v = log[k];
    if (typeof v === 'string' && /^\d{5,}$/.test(v)) ids.add(v);
    if (Array.isArray(v)) v.forEach(id => (typeof id === 'string' && /^\d{5,}$/.test(id)) && ids.add(id));
  }
  return ids;
}
const LOG_CHANNEL_IDS = collectLogChannelIds();

// Mesajı kaydet (embed + content + components)
function saveMessageRecord(message) {
  try {
    if (!message?.id || !message?.channelId) return;
    // Sadece embed içeren mesajları koru (log mesajı niteliği)
    const embeds = (message.embeds || []).map(e => e.toJSON());
    if (!embeds.length) return;

    const components = (message.components || []).map(row => row.toJSON());
    const payload = {
      channelId: message.channelId,
      content: typeof message.content === 'string' ? message.content : null,
      embeds,
      components,
    };
    const store = loadStore();
    store.messages[message.id] = payload;
    saveStore(store);
  } catch {}
}

// Silineni yeniden gönder
async function resurrectMessage(client, messageId) {
  try {
    const store = loadStore();
    const rec = store.messages[messageId];
    if (!rec) return; // kayıt yoSta boşver

    const guilds = client.guilds.cache;
    // Kanalı bul ve gönder
    let channel = null;
    for (const [, g] of guilds) {
      channel = g.channels.cache.get(rec.channelId) || await g.channels.fetch(rec.channelId).catch(() => null);
      if (channel) break;
    }
    if (!channel || !channel.isTextBased()) return;

    // Yeniden gönder
    const sent = await channel.send({
      content: rec.content ?? undefined,
      embeds: rec.embeds ?? [],
      components: rec.components ?? [],
    });

    // Eski kaydı kaldır, yeni mesajı kaydet (koruma devam etsin)
    delete store.messages[messageId];
    store.messages[sent.id] = rec;
    saveStore(store);
  } catch {}
}

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    // Mesaj oluşturulunca: eğer log kanalındaysa ve embed içeriyorsa kaydet
    client.on(Events.MessageCreate, (message) => {
      try {
        if (!message?.guild || !message?.channelId) return;
        if (!LOG_CHANNEL_IDS.has(message.channelId)) return;
        // webhook veya bot fark etmeStizin log embed'lerini sakla
        saveMessageRecord(message);
      } catch {}
    });

    // Mesaj düzenlenirse (örneğin buton eklenirse), kaydı güncelle
    client.on(Events.MessageUpdate, (oldMessage, newMessage) => {
      try {
        const msg = newMessage ?? oldMessage;
        if (!msg?.guild || !msg?.channelId) return;
        if (!LOG_CHANNEL_IDS.has(msg.channelId)) return;
        saveMessageRecord(newMessage ?? oldMessage);
      } catch {}
    });

    // Tekli silme: kayıttaysa dirilt
    client.on(Events.MessageDelete, async (message) => {
      try {
        // Sadece log kanallarını izle (id partial gelse bile channelId varsa kontrol et)
        const chId = message?.channelId;
        if (!chId || !LOG_CHANNEL_IDS.has(chId)) return;
        await resurrectMessage(client, message.id);
      } catch {}
    });

    // Toplu silme: hepsini dirilt
    client.on(Events.MessageBulkDelete, async (messages) => {
      try {
        for (const msg of messages.values()) {
          const chId = msg?.channelId;
          if (!chId || !LOG_CHANNEL_IDS.has(chId)) continue;
          await resurrectMessage(client, msg.id);
        }
      } catch {}
    });
  },
};
