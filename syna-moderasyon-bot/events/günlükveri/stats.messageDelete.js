// events/günlükveri/stats.messageDelete.js
const path = require('path');
const Stats = require(path.join(__dirname, '..', '..', 'utils', 'stats'));

module.exports = {
  name: 'messageDelete',
  async execute(message) {
    if (!message?.guild) return;
    Stats.bump('msgDeleted');
  }
};
