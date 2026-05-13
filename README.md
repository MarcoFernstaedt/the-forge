# The Forge

Gamified skill tree and goal tracker for empire builders. Anyone can use it to track skills, goals, habits, or any progression system.

## Stack

- **Backend:** FastAPI + SQLAlchemy + SQLite
- **Frontend:** Next.js + TypeScript + Tailwind (static export)
- **Visualization:** Custom Canvas 2D (skill tree + Obsidian graph)

## Quick Start

### Backend

```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
./start.sh
```

API runs on `http://localhost:8002` with auto-reload.

### Frontend

```bash
cd frontend
npm install
npm run build
# Serve the dist/ folder with any static server
npx serve dist
```

## Features

- **Skill Trees:** Create, clone, and customize branching skill trees
- **Prerequisites:** Lock skills behind mastery of others
- **XP & Levels:** Award XP, track levels with scaling difficulty
- **Streaks:** Activity streak tracking with longest-streak record
- **Obsidian Vault Sync:** Scan your vault, extract activities, visualize note connections as a force-directed graph
- **Multi-user:** API-key auth, dev mode fallback, registration/login flow
- **Error Handling:** Global exception handlers, API error boundaries, retry-friendly client

## Architecture

```
backend/app/
  core/          # Config, security, custom errors
  models/        # SQLAlchemy models + database setup
  schemas/       # Pydantic request/response models
  services/      # Business logic (XP engine, stats, Obsidian scanner)
  api/routes/    # Route handlers (users, trees, skills, activities, obsidian, stats)
  utils/         # Seed data

frontend/
  lib/           # API client + shared TypeScript types
  components/    # Reusable UI (canvas, error boundary, spinner, graph)
  pages/         # Next.js pages (dashboard, tree, obsidian, activities, login)
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///data/forge.db` | Database connection |
| `FORGE_DEV_MODE` | `true` | Auto-create default user, skip API key |
| `CORS_ORIGINS` | `*` | Comma-separated allowed origins |
| `DEFAULT_VAULT_PATH` | `/home/marco/obsidian-vault` | Default Obsidian vault |

## API Endpoints

- `GET  /` — Health + version
- `GET  /health` — Liveness check
- `POST /users` — Create account
- `GET  /users/me` — Current user
- `GET  /trees` — List trees
- `POST /trees` — Create tree
- `GET  /trees/{id}` — Tree with your progress
- `POST /trees/{id}/clone` — Clone a template
- `POST /trees/{id}/init` — Initialize progress
- `GET  /skills/tree/{tree_id}` — List skills
- `POST /activities` — Log activity + award XP
- `GET  /activities` — Activity feed
- `GET  /stats` — Full stats (XP, level, streak)
- `POST /obsidian/sync` — Scan vault
- `GET  /obsidian/graph` — Vault graph data
- `GET  /obsidian/notes` — Synced notes
