# Collab Cockpit

A lightweight collaboration cockpit for David and Albert.

## What it does

- Scores workstreams so the next focus is obvious
- Flags collaboration friction early: stale work, blocked work, fuzzy next steps, and overdue decisions
- Generates three copy-ready briefs: async update, weekly review, and unblock plan
- Tracks decisions and recent updates in one place
- Supports local JSON export/import so the board is easy to back up or move
- Stores data locally in the browser for fast, private use
- Supports a simple password gate for deployed environments via `APP_PASSWORD`

## Local development

```bash
npm install
npm run dev
```

## Deploy

Set `APP_PASSWORD` in Vercel if you want the app protected.
