"""Scan Obsidian vault and build graph."""
import os
import re
import json
from datetime import datetime, timezone
from typing import List, Dict, Any
from pathlib import Path

from app.models.models import ObsidianLink


WIKILINK_RE = re.compile(r"\[\[([^\]]+)\]\]")
TAG_RE = re.compile(r"#([a-zA-Z0-9_/-]+)")
FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---", re.DOTALL)


def extract_frontmatter(content: str) -> tuple[dict, str]:
    match = FRONTMATTER_RE.match(content)
    if match:
        try:
            import yaml
            fm = yaml.safe_load(match.group(1))
            return fm or {}, content[match.end():]
        except Exception:
            pass
    return {}, content


def parse_markdown_file(file_path: str) -> Dict[str, Any] | None:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception:
        return None

    fm, body = extract_frontmatter(content)
    title = fm.get("title", Path(file_path).stem.replace("-", " ").replace("_", " "))
    tags = set(fm.get("tags", []))
    tags.update(TAG_RE.findall(content))
    links = WIKILINK_RE.findall(content)
    words = len(body.split())

    # Extract potential achievements
    activities = []
    achievement_lines = [l.strip() for l in body.split("\n") if any(k in l.lower() for k in ["done", "shipped", "built", "closed", "won", "hired", "launched", "fixed", "deployed", "completed"])]
    for line in achievement_lines[:5]:
        clean = line.strip("- *").strip()
        if len(clean) > 10:
            activities.append(clean)

    return {
        "title": title,
        "file_path": file_path,
        "tags": sorted(tags),
        "links": links,
        "word_count": words,
        "activities": activities,
    }


def scan_vault(vault_path: str) -> List[Dict[str, Any]]:
    results = []
    root = Path(vault_path)
    if not root.exists():
        return results

    for md_file in root.rglob("*.md"):
        # Skip hidden dirs and templates
        if any(p.startswith(".") for p in md_file.relative_to(root).parts):
            continue
        parsed = parse_markdown_file(str(md_file))
        if parsed:
            parsed["vault_path"] = str(md_file.relative_to(root))
            results.append(parsed)

    return results


def build_graph(notes: List[Dict[str, Any]]) -> Dict[str, Any]:
    nodes = []
    links = []
    seen = set()

    for note in notes:
        nid = note["vault_path"]
        if nid not in seen:
            seen.add(nid)
            nodes.append({
                "id": nid,
                "label": note["title"],
                "group": "note",
                "val": max(1, note["word_count"] // 500),
            })

        for link in note.get("links", []):
            # Find target note
            target = link.split("|")[0].strip()
            target_path = None
            for n in notes:
                if n["title"].lower() == target.lower() or Path(n["vault_path"]).stem.lower() == target.lower():
                    target_path = n["vault_path"]
                    break

            if target_path and target_path != nid:
                links.append({"source": nid, "target": target_path})
                if target_path not in seen:
                    seen.add(target_path)
                    nodes.append({
                        "id": target_path,
                        "label": target,
                        "group": "link",
                        "val": 1,
                    })

    return {"nodes": nodes, "links": links}
