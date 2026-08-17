// utils/stats.js
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../stats.json');

const DEFAULTS = {
  joins: 0,
  leaves: 0,
  msgDeleted: 0,
  msgEdited: 0,
  nameChanged: 0,
  roleGiven: 0,
  roleTaken: 0,
  bans: 0,
  unbans: 0,
  warnings: 0,
  whitelistPenalty: 0,
  registers: 0,
  tickets: 0,
  messagesSent: 0,
  voiceSeconds: 0,
  windowStart: 0
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function load() {
  try {
    const raw = fs.readFileSync(FILE, 'utf8');
    const data = JSON.parse(raw);
    return { ...DEFAULTS, ...data };
  } catch {
    const d = { ...DEFAULTS, windowStart: startOfToday() };
    fs.writeFileSync(FILE, JSON.stringify(d, null, 2));
    return d;
  }
}

function save(state) {
  fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
}

const state = load();

function bump(key, by = 1) {
  if (!(key in state)) state[key] = 0;
  state[key] += by;
  save(state);
}

function addVoiceSeconds(sec) {
  state.voiceSeconds += Math.max(0, Math.floor(sec));
  save(state);
}

function setWindowStart(ts) {
  state.windowStart = ts;
  save(state);
}

function resetForNewDay() {
  for (const k of Object.keys(DEFAULTS)) {
    if (k === 'windowStart') continue;
    state[k] = 0;
  }
  state.windowStart = startOfToday();
  save(state);
}

function formatHMS(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${h} saat, ${m} dakika ${ss} saniye`;
}

module.exports = {
  state,
  bump,
  addVoiceSeconds,
  resetForNewDay,
  setWindowStart,
  formatHMS,
  startOfToday,
};
