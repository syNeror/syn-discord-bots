// events/günlükveri/stats.messageCreate.js
const path = require('path');
const Stats = require(path.join(__dirname, '..', '..', 'utils', 'stats'));

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild || message.author?.bot) return;
    Stats.bump('messagesSent');
  }
};
