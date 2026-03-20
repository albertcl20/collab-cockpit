# Collab Cockpit

A lightweight collaboration cockpit for David and Albert.

## What it does

- Scores workstreams so the next focus is obvious
- Surfaces collaboration drag, not just project status
- Generates four copy-ready outputs: alignment agenda, async update, weekly review, and unblock plan
- Adds a collaboration coach that turns board state into direct asks, quick-sync prep, async handoffs, and an execution plan for Albert
- Adds an inbox distiller that turns messy pasted notes into a structured update, likely blocker/decision/ask, and a suggested workstream patch
- Adds a protocol planner that recommends which work deserves async handling, a quick sync, a deep dive, or a decision review
- Adds a what-if simulator that compares likely interventions before David and Albert spend real time on them
- Builds a concrete 7-day collaboration plan from the current board state
- Tracks decisions, recent updates, blockers, and explicit asks in one place
- Saves local snapshots so you can compare collaboration health over time, including a simple health trend chart
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

## Verify a live deployment

```bash
DEPLOY_URL=https://your-app.vercel.app \
APP_PASSWORD=zxcQWE123 \
npm run verify:deploy
```

The verification checks:
- `/login`
- `/api/login` (when `APP_PASSWORD` is set)
- `/`
- `/api/health`
