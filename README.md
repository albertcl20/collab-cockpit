# Collab Cockpit

A lightweight collaboration cockpit for David and Albert.

## What it does

- Scores workstreams so the next focus is obvious
- Surfaces collaboration drag, not just project status
- Generates four copy-ready outputs: alignment agenda, async update, weekly review, and unblock plan
- Adds a collaboration coach that turns board state into direct asks, quick-sync prep, async handoffs, and an execution plan for Albert
- Adds an inbox distiller that turns messy pasted notes into a structured update, likely blocker/decision/ask, and a suggested workstream patch
- Adds a conversation translator that turns rough chat threads into extracted actions, decision candidates, a crisp digest, and a ready-to-create workstream
- Adds a protocol planner that recommends which work deserves async handling, a quick sync, a deep dive, or a decision review
- Adds a collaborator map that spots who is overloaded, who is bottlenecking execution, and drafts exact outreach for each person
- Adds collaborator memory so 1:1 prep keeps persistent working-style notes, friction watchouts, and next-best asks per person
- Adds a delegation board that makes the handoff explicit: what David should decide, what Albert can run, what needs a shared pass, and what is blocked on someone else
- Adds an operating memo that splits the board into the exact brief for David, the exact work for Albert, and the one stakeholder ping worth sending next
- Adds a commitment pulse that tracks which promises are due now, which are drifting this week, and what exact follow-up to send before execution silently slips
- Adds a collaboration debt queue that ranks the most expensive blockers, dependencies, decision gaps, vague handoffs, and overlap so the team knows what to clean up first
- Adds a collaboration retro that identifies recurring system failure patterns and proposes 2-week process fixes worth testing
- Adds a what-if simulator that compares likely interventions before David and Albert spend real time on them
- Builds a concrete 7-day collaboration plan from the current board state
- Tracks decisions, recent updates, blockers, and explicit asks in one place
- Saves local snapshots so you can compare collaboration health over time, including a simple health trend chart
- Supports local JSON export/import so the board is easy to back up or move
- Stores data locally in the browser for fast, private use
- Supports shareable cockpit links that carry the exact board state for handoffs without needing JSON exports
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
