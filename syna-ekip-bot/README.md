# syna-ekip-bot

A Discord bot built with discord.js that runs internal team processes: applications, activity tracking, warnings and welcome cards.

## Installation

1. Make sure Node.js is installed
2. Install the dependencies:
```bash
npm install
```

3. Copy `config.example.json` to `config.json` and add your bot token
4. Start the bot:
```bash
npm start
```

## Project structure

- `index.js` — main bot file
- `config.json` — bot configuration (not in the repository, create it yourself)
- `commands/` — slash commands
- `events/` — bot events
- `data/` — data files (not in the repository, generated at runtime)

## Commands

- `/başvuru` — application flow
- `/aktiflik` — voice channel activity report
- `/uyarı` — internal team warnings
- `/setup` — initial setup

## Development

To run in development mode:
```bash
npm run dev
```
