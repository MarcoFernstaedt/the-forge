# The Forge — Architecture & Design Document

**Status:** In Progress  
**Date:** 2026-05-12

## Vision

A gamified skill tracker where every skill is a node in an interactive tree. Complete real-world activities → gain XP → unlock adjacent skills → watch your empire grow visually. Dark, gold-on-obsidian aesthetic. Accessible by default. Multi-tenant from day one.

## Core Principles

1. **Progress must be visible.** Invisible progress kills motivation.
2. **Real achievements only.** XP comes from actual commits, contracts, calls, courses — not checkboxes.
3. **Accessible first.** Full keyboard nav, screen reader support, audio descriptions.
4. **Multi-user.** Anyone can create an account, define their own trees, and track their own empire.
5. **Obsidian-integrated.** Seamlessly pull achievements from your vault.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Skill Tree   │  │ Dashboard    │  │ Obsidian Viewer  │  │
│  │ (Canvas)     │  │ (Stats/XP)   │  │ (Notes Timeline) │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/JSON
┌──────────────────────────┴──────────────────────────────────┐
│                     FastAPI Backend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Trees API    │  │ XP Engine    │  │ Obsidian Sync    │  │
│  │ Skills CRUD  │  │ Progress     │  │ Vault Scanner    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │   SQLite    │
                    │  (single    │
                    │   file DB)  │
                    └─────────────┘
```

## Database Schema

### users
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| username | TEXT UNIQUE | |
| display_name | TEXT | |
| created_at | TIMESTAMP | |

### skill_trees
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER FK | nullable = public templates |
| name | TEXT | e.g. "Empire Builder" |
| description | TEXT | |
| category | TEXT | e.g. "business", "tech" |
| is_template | BOOLEAN | true = available to all users |
| created_at | TIMESTAMP | |

### skills (nodes)
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| tree_id | INTEGER FK | |
| name | TEXT | e.g. "FastAPI" |
| description | TEXT | spoken description for SR |
| category | TEXT | branch color group |
| x | FLOAT | canvas position (0-1 normalized) |
| y | FLOAT | canvas position (0-1 normalized) |
| xp_required | INTEGER | to unlock this node |
| prerequisite_ids | TEXT | JSON array of skill IDs |
| max_xp | INTEGER | XP to master |
| icon | TEXT | emoji or icon name |
| created_at | TIMESTAMP | |

### user_progress
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER FK | |
| skill_id | INTEGER FK | |
| current_xp | INTEGER | |
| status | TEXT | locked / unlocked / mastered |
| unlocked_at | TIMESTAMP | nullable |
| mastered_at | TIMESTAMP | nullable |

### activities (XP log)
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER FK | |
| skill_id | INTEGER FK | nullable (can be auto-assigned) |
| description | TEXT | what you did |
| xp_amount | INTEGER | |
| source | TEXT | "manual", "obsidian", "github", "api" |
| source_url | TEXT | link to proof |
| created_at | TIMESTAMP | |

### obsidian_links
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER FK | |
| vault_path | TEXT | path in vault |
| note_title | TEXT | |
| tags | TEXT | JSON array |
| extracted_activities | TEXT | JSON array of activities |
| last_sync | TIMESTAMP | |

## API Endpoints

### Trees
- `GET /trees` — list trees (public templates + user's)
- `POST /trees` — create new tree
- `GET /trees/{id}` — get tree with skills
- `PUT /trees/{id}` — update tree
- `DELETE /trees/{id}` — delete tree

### Skills
- `GET /trees/{id}/skills` — list skills in tree
- `POST /trees/{id}/skills` — add skill node
- `PUT /skills/{id}` — update skill
- `DELETE /skills/{id}` — remove skill

### Progress
- `GET /progress` — get all progress for current user
- `GET /progress/tree/{tree_id}` — progress for specific tree
- `POST /activities` — log activity and award XP
- `GET /activities` — activity history

### Obsidian
- `POST /obsidian/sync` — scan vault and create activities
- `GET /obsidian/notes` — list linked notes
- `GET /obsidian/timeline` — chronological activity feed from vault

## Frontend Routes

- `/` — Landing + dashboard overview
- `/trees` — Browse and create trees
- `/tree/{id}` — Interactive skill tree (main feature)
- `/activities` — Activity log and XP history
- `/obsidian` — Vault integration view

## Skill Tree Visualization

- Canvas-based rendering (HTML5 Canvas API)
- Nodes: circles with icon + name
- Connections: bezier curves between connected skills
- States: locked (dimmed), unlocked (glowing), mastered (gold burst)
- Interactions: hover (tooltip), click (detail panel), keyboard nav (arrow keys)
- Particle effects on unlock: gold sparks emanating from node
- Camera: pan and zoom with mouse wheel / pinch

## Color Palette

- Background: #0a0a0c (obsidian)
- Node locked: #3a3a3c (dark grey)
- Node unlocked: #b8923c (brushed gold)
- Node mastered: #f4d77a (polished gold)
- Connections: #c4c4ca (silver)
- Text primary: #ffffff
- Text secondary: #c4c4ca
- Accent: #f4d77a

## Accessibility

- Every node has `aria-label` with name, status, and XP
- Keyboard: Tab/Shift+Tab between nodes, Enter to open detail, arrows to navigate connections
- Audio: Web Speech API announces unlocks and mastery
- High contrast mode toggle

## Multi-User Design

- Trees can be private (user_id set) or public templates (is_template=true)
- Users clone templates to their own account
- Each user has their own progress table
- No auth required for viewing public templates
- Simple API key or session-based auth for mutations
