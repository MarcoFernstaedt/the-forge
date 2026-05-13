"""Obsidian vault routes."""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.base import get_db
from app.models.models import ObsidianLink
from app.schemas.schemas import ObsidianSyncRequest, ObsidianNoteOut, ObsidianGraphOut
from app.api.deps import get_current_user
from app.services.obsidian_scanner import scan_vault, build_graph
from app.core.config import settings
from app.core.errors import NotFoundError

router = APIRouter(prefix="/obsidian", tags=["obsidian"])


@router.get("/notes", response_model=List[ObsidianNoteOut])
def list_obsidian_notes(db: Session = Depends(get_db), user = Depends(get_current_user)):
    notes = db.query(ObsidianLink).filter(ObsidianLink.user_id == user.id).order_by(ObsidianLink.last_sync.desc()).all()
    return notes


@router.post("/sync")
def sync_obsidian(req: ObsidianSyncRequest, db: Session = Depends(get_db), user = Depends(get_current_user)):
    vault_path = req.vault_path or settings.DEFAULT_VAULT_PATH
    scanned = scan_vault(vault_path)

    # Clear old entries for this user
    db.query(ObsidianLink).filter(ObsidianLink.user_id == user.id).delete()

    for item in scanned:
        link = ObsidianLink(
            user_id=user.id,
            vault_path=vault_path,
            note_title=item["title"],
            file_path=item["vault_path"],
            tags=json.dumps(item.get("tags", [])),
            links=json.dumps(item.get("links", [])),
            extracted_activities=json.dumps(item.get("activities", [])),
            word_count=item.get("word_count", 0),
        )
        db.add(link)

    db.commit()
    return {"message": f"Synced {len(scanned)} notes", "count": len(scanned)}


@router.get("/graph", response_model=ObsidianGraphOut)
def get_graph(db: Session = Depends(get_db), user = Depends(get_current_user)):
    notes = db.query(ObsidianLink).filter(ObsidianLink.user_id == user.id).all()
    data = []
    for note in notes:
        import json
        data.append({
            "vault_path": note.file_path,
            "title": note.note_title,
            "tags": json.loads(note.tags or "[]"),
            "links": json.loads(note.links or "[]"),
            "word_count": note.word_count,
        })
    graph = build_graph(data)
    return graph


import json
