# Syn Discord Bot Suite

A Turkish-language bot suite that splits the work of keeping a Discord community running across four separate bots. Moderation, support tickets, team management and general use — each one focused on its own job and running independently of the others.

All of them are built on [discord.js v14](https://discord.js.org) and work with slash commands.

---

## The bots in this suite

### syna-moderasyon-bot

The most comprehensive bot in the suite. Punishment system, registration flow, support tickets and detailed server logging all in one.

- **Punishment management** — ban, unban, perma-ban, mute, unmute, allmute, warn / view / delete warnings, tiered warning roles
- **Blacklist** — blacklist and blacklist pardons, ban pardons
- **Support tickets** — ticket setup, renaming, adding/removing users, ticket counter and leaderboard
- **Team tools** — staff and staff voice tracking, team creation, role distribution, invite tracking
- **Giveaway system** — starting giveaways and drawing winners
- **22 different event logs** — channel, role, server, member, message (delete/edit), voice channel activity, ban entries and removals
- Helper commands such as maintenance mode, DM announcements, user info cards and IP lookup

### syna-ticket-bot

A lean bot focused solely on support tickets and the order flow. Ticket categories, a separate category for buyers, staff role checks and a ticket log. Automatically closes the open ticket of a member who leaves.

### syna-ekip-bot

The bot that runs internal team processes.

- **Application system** — form flow and review
- **Activity tracking** — records voice channel durations
- **Warning system** — internal team warnings
- **Welcome cards** — join/leave cards (image generation via canvafy)
- Message edit/delete and username change logs

### syna-public-bot

Lightweight commands anyone can use: avatar display, server info, FiveM server status lookup, auto-role, role transfer, automod, ban/unban/forceban and bulk channel deletion.

---

## Installation

Node.js 16.11 or newer is required.

Each bot runs independently in its own folder. Go into the folder of the bot you want to set up:

```bash
cd syna-moderasyon-bot
npm install
```

### Configuration

Real `config.json` files are **not** in this repository — they contain bot tokens and are deliberately kept out. Copy the example file in each folder and fill it in:

```bash
copy config.example.json config.json     # Windows
cp config.example.json config.json       # Linux / macOS
```

What you need to fill in:

| Field | Where to get it |
| --- | --- |
| `token` | [Discord Developer Portal](https://discord.com/developers/applications) → Bot → Reset Token |
| `clientId` | Same page, General Information → Application ID |
| `guildId` | Right-click your server → Copy Server ID |
| Role / channel IDs | Right-click the relevant role or channel → Copy ID |

> To copy IDs you need to enable **Advanced → Developer Mode** in your Discord settings.

The bot must have **Server Members Intent** and **Message Content Intent** enabled in the Developer Portal.

### Running

Register the slash commands with Discord once, then start the bot:

```bash
node deploy-commands.js
npm start
```

---

## Host it on your own server

You don't need to pay a monthly fee for these bots.

There are plenty of services selling Discord bots or asking for a monthly subscription under a "premium" package. But a Discord bot only needs a machine with Node.js installed and an uninterrupted internet connection to run. Every bot in this suite is open source, entirely under your control, and yours to run wherever you like.

If you already have hosting, install them there; if not, the smallest VPS you can get for a few dollars a month will comfortably handle all four at once. An old computer, a Raspberry Pi, even a mini PC sitting at home will do. To keep the process alive, a tool like `pm2` is all you need:

```bash
npm install -g pm2
pm2 start index.js --name moderasyon-bot
pm2 save
pm2 startup
```

That much is enough for the bot to come back up on its own even if the machine restarts.

The real gain of self-hosting isn't saving money either: your data stays with you, you can modify the bot however you want, and when a service shuts down or raises its prices you aren't left with nothing. The code is here, the setup is above — the rest is up to you.

---

## Contributing and usage

You're free to read through the code, adapt it to your own server and build on it. If you find a bug or improve something, don't hesitate to open an issue.

## Security note

Never share your bot token under any circumstances, and never commit it to the repository. If you've accidentally pasted the token somewhere, reset it immediately with **Reset Token** in the Developer Portal — anyone who gets hold of it can use every permission your bot has.

Likewise, `data/` folders are kept out of the repository because they hold backups and records belonging to your server.
