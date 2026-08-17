// events/günlükveri/stats.guildMemberUpdate.js
const path = require('path');
const Stats = require(path.join(__dirname, '..', '..', 'utils', 'stats'));

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    if (!newMember?.guild) return;

    // İsim değişimi
    const oldName = oldMember.displayName;
    const newName = newMember.displayName;
    if (oldName !== newName) Stats.bump('nameChanged');

    // Rol değişimleri
    const added = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
    const removed = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));
    if (added.size) Stats.bump('roleGiven', added.size);
    if (removed.size) Stats.bump('roleTaken', removed.size);
  }
};
