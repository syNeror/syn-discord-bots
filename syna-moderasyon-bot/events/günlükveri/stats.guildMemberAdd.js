// events/günlükveri/stats.guildMemberAdd.js
const path = require('path');
const Stats = require(path.join(__dirname, '..', '..', 'utils', 'stats'));

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    if (!member?.guild) return;
    Stats.bump('joins');
  }
};
