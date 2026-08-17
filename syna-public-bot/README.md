# syna-public-bot

A general-purpose Discord bot with lightweight commands anyone can use, plus a few moderation tools. All user-facing messages are in Turkish.

## Features

- **Auto-role** — automatically assigns a role to new members
- **Moderation** — ban, unban, forceban (banning a user who isn't in the server), bulk channel deletion
- **Automod** — automatic message filtering
- **Info commands** — avatar display, server info, FiveM server status
- **Role transfer** — moves members holding one role over to another
- Modern slash command interface

## Commands

| Command | What it does | Permission |
| --- | --- | --- |
| `/otorol ayarla` | Sets up the auto-role system (`rol` and `kanal` parameters) | Administrator |
| `/otorol iptal` | Disables the auto-role system | Administrator |
| `/automod` | Manages message filtering | Administrator |
| `/ban` | Bans a member | Ban Members |
| `/forceban` | Bans a user by ID who isn't in the server | Ban Members |
| `/unban` | Lifts a ban | Ban Members |
| `/kanallari-sil` | Bulk channel deletion | Administrator |
| `/rol-tasi` | Transfers members from one role to another | Manage Roles |
| `/avatar` | Displays a user's avatar | — |
| `/sunucu-bilgi` | Shows server information | — |
| `/fivem-status` | Queries the status of a FiveM server | — |

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure the bot**:
   - Copy `config.example.json` to `config.json` and fill it in
   - Get the bot token from the Discord Developer Portal
   - Get the Client ID from your bot application
   - Get the Guild ID from your Discord server

3. **Deploy the commands**:
   ```bash
   npm run deploy
   ```

4. **Start the bot**:
   ```bash
   npm start
   ```

## Configuration

### config.json

This file is not in the repository — it holds your bot token. Create it from `config.example.json`:

```json
{
  "token": "YOUR_BOT_TOKEN_HERE",
  "clientId": "YOUR_CLIENT_ID_HERE",
  "guildId": "YOUR_GUILD_ID_HERE"
}
```

## File structure

```
├── commands/              # Slash command implementations
├── config.example.json    # Configuration template
├── config.json            # Your configuration (not in the repository)
├── autoRoleData.json      # Auto-role settings storage (generated at runtime)
├── index.js               # Main bot file
├── deploy-commands.js     # Command deployment script
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## Usage

1. Invite the bot to your server with the appropriate permissions
2. Run `/otorol ayarla` to configure the auto-role system
3. New members will automatically receive the role you specified
4. Notifications are sent to the channel you specified

## Required permissions

- Send Messages
- Manage Roles
- Use Slash Commands
- Read Message History
- View Channels
- Ban Members (for the moderation commands)
- Manage Channels (for bulk channel deletion)

## Support

For support or questions, open an issue.
