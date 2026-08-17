// events/günlükveri/stats.messageUpdate.js
const path = require('path');
const Stats = require(path.join(__dirname, '..', '..', 'utils', 'stats'));

module.exports = {
  name: 'messageUpdate',
  async execute(oldMsg, newMsg) {
    if (!newMsg?.guild || newMsg?.author?.bot) return;
    if ((oldMsg?.content ?? '') !== (newMsg?.content ?? '')) {
      Stats.bump('msgEdited');
    }
  }
};
