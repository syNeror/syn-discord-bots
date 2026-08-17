// events/günlükveri/stats.voiceStateUpdate.js
const path = require('path');
const Stats = require(path.join(__dirname, '..', '..', 'utils', 'stats'));

// Kullanıcı -> ses oturumu başlangıcı
const active = new Map();

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    const wasIn = !!oldState.channelId;
    const isIn  = !!newState.channelId;
    const now = Date.now();

    // Eski kanaldan ayrıldıysa (veya kanal değiştirdiyse) süreyi ekle
    if (wasIn && (!isIn || oldState.channelId !== newState.channelId)) {
      const start = active.get(oldState.id);
      if (start) {
        const secs = (now - start) / 1000;
        Stats.addVoiceSeconds(secs);
        active.delete(oldState.id);
      }
    }

    // Yeni kanala girdiyse sayaç başlat
    if (!wasIn && isIn) {
      active.set(newState.id, now);
    }
  }
};
