const { Events } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`✅ ${client.user.tag} olarak giriş yapıldı!`);
    
    // Ticket paneli autoload
    try {
      const ticketCommand = client.commands.get("ticketkurulum");
      if (ticketCommand && ticketCommand.autoload) {
        ticketCommand.autoload(client);
      }
    } catch (error) {
      console.error("<:13899754306013758771:1414619305445691473> Ticket paneli yüklenirken hata:", error);
    }
  },
};
