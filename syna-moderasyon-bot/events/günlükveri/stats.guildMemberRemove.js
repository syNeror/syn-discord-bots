// events/günlükveri/stats.guildMemberRemove.js
const path = require('path');
const Stats = require(path.join(__dirname, '..', '..', 'utils', 'stats'));

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    if (!member?.guild) return;
    Stats.bump('leaves');
  }
};
