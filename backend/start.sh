#!/usr/bin/env bash
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
source .venv/bin/activate 2>/dev/null || true
uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload
