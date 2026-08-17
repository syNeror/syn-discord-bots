const { QuickDB } = require("quick.db");
const db = new QuickDB();

function getWarnRoleMapFromConfig(config) {
  // config.Uyarılar: { "1x": "ROLE", "2x": "ROLE", ... }
  const src = config?.Uyarılar || {};
  return Object.entries(src)
    .map(([k, roleId]) => {
      const n = parseInt(String(k).toLowerCase().replace("x", ""), 10);
      return Number.isFinite(n) && roleId ? { min: n, roleId } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.min - b.min);
}

async function getUserData(guildId, userId) {
  const key = `warns.${guildId}.${userId}`;
  const def = { count: 0, total: 0, lastDecay: Date.now() };
  const current = (await db.get(key)) || def;
  if (!await db.get(key)) await db.set(key, def);
  return current;
}

async function setUserData(guildId, userId, data) {
  await db.set(`warns.${guildId}.${userId}`, data);
}

async function nextPenaltyId(guildId) {
  return (await db.add(`guild.${guildId}.penaltyId`, 1)) || 1;
}

async function applyWarnRoles(member, warnCount, config) {
  if (!member || !member.manageable) return;

  const MAP = getWarnRoleMapFromConfig(config);
  if (MAP.length === 0) return;

  // hedef: warnCount >= min olan EN YÜStEK eşik
  const target = [...MAP].reverse().find(r => warnCount >= r.min);

  const allWarnRoleIds = MAP.map(r => r.roleId);
  const toRemove = member.roles.cache.filter(r => allWarnRoleIds.includes(r.id) && (!target || r.id !== target.roleId));
  if (toRemove.size) await member.roles.remove(toRemove).catch(() => {});
  if (target && !member.roles.cache.has(target.roleId)) {
    await member.roles.add(target.roleId).catch(() => {});
  }
}

function agoString(msAgo) {
  const s = Math.floor(msAgo / 1000);
  if (s < 60) return `${s} seconds ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minutes ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hours ago`;
  const d = Math.floor(h / 24);
  return `${d} days ago`;
}

module.exports = {
  getWarnRoleMapFromConfig,
  getUserData,
  setUserData,
  nextPenaltyId,
  applyWarnRoles,
  agoString,
};
