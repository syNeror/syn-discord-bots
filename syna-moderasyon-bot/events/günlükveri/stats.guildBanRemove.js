// events/günlükveri/stats.guildBanRemove.js
const path = require('path');
const Stats = require(path.join(__dirname, '..', '..', 'utils', 'stats'));

module.exports = {
  name: 'guildBanRemove',
  async execute() {
    Stats.bump('unbans');
  }
};
