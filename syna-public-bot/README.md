# Synatx Discord Bot

Discord bot with auto-role functionality for Turkish Discord servers.

## Features

- **Auto-Role System**: Automatically assigns roles to new members
- **Slash Commands**: Modern Discord slash command interface
- **Turkish Language Support**: All messages and responses in Turkish

## Commands

### `/otorol ayarla`
- **Description**: Sets up the auto-role system
- **Parameters**:
  - `rol`: Role to assign to new members (required)
  - `kanal`: Channel to send notifications (required)
- **Permissions**: Administrator

### `/otorol iptal`
- **Description**: Disables the auto-role system
- **Permissions**: Administrator

## Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Bot**:
   - Edit `config.json` with your bot token and IDs
   - Get bot token from Discord Developer Portal
   - Get Client ID from your bot application
   - Get Guild ID from your Discord server

3. **Deploy Commands**:
   ```bash
   npm run deploy
   ```

4. **Start Bot**:
   ```bash
   npm start
   ```

## Configuration

### config.json
```json
{
  "token": "YOUR_BOT_TOKEN_HERE",
  "clientId": "YOUR_CLIENT_ID_HERE",
  "guildId": "YOUR_GUILD_ID_HERE"
}
```

## File Structure

```
├── commands/
│   └── otorol.js          # Auto-role command implementation
├── config.json            # Bot configuration
├── autoRoleData.json      # Auto-role settings storage
├── index.js              # Main bot file
├── deploy-commands.js    # Command deployment script
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

## Usage

1. Invite bot to your server with proper permissions
2. Use `/otorol ayarla` to configure auto-role system
3. New members will automatically receive the specified role
4. Notifications will be sent to the specified channel

## Permissions Required

- Send Messages
- Manage Roles
- Use Slash Commands
- Read Message History
- View Channels

## Support

For support or questions, contact the bot developer.
