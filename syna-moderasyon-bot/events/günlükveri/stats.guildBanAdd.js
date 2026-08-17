// events/günlükveri/stats.guildBanAdd.js
const path = require('path');
const Stats = require(path.join(__dirname, '..', '..', 'utils', 'stats'));

module.exports = {
  name: 'guildBanAdd',
  async execute() {
    Stats.bump('bans');
  }
};
