"""Progress notes routes."""
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.base import get_db
from app.models.models import ProgressNote
from app.schemas.schemas import ProgressNoteCreate, ProgressNoteOut, VaultNoteCreate
from app.api.deps import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("", response_model=List[ProgressNoteOut])
def list_notes(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(ProgressNote).filter(ProgressNote.user_id == user.id).order_by(ProgressNote.created_at.desc()).all()


@router.post("", response_model=ProgressNoteOut)
def create_note(req: ProgressNoteCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    note = ProgressNote(
        user_id=user.id,
        title=req.title,
        content=req.content,
        tags=json.dumps(req.tags),
        linked_skill_id=req.linked_skill_id,
        linked_tree_id=req.linked_tree_id,
        mood=req.mood,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    note = db.query(ProgressNote).filter(ProgressNote.id == note_id, ProgressNote.user_id == user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
    return {"message": "Note deleted"}


@router.post("/vault-create")
def create_vault_note(req: VaultNoteCreate, user=Depends(get_current_user)):
    vault_path = req.vault_path or settings.DEFAULT_VAULT_PATH
    vault_dir = Path(vault_path)

    if not vault_dir.exists():
        raise HTTPException(status_code=400, detail=f"Vault path does not exist: {vault_path}")

    safe_title = re.sub(r'[^\w\s-]', '', req.title).strip().replace(' ', '-')
    filename = f"{safe_title}.md"
    file_path = vault_dir / filename

    tag_str = "\n".join(f"  - {t}" for t in req.tags) if req.tags else ""
    frontmatter = f"---\ntags:\n{tag_str}\ncreated: {datetime.now(timezone.utc).isoformat()}\n---\n\n" if req.tags else f"---\ncreated: {datetime.now(timezone.utc).isoformat()}\n---\n\n"

    file_path.write_text(frontmatter + req.content, encoding="utf-8")
    return {"message": f"Note '{req.title}' created in vault", "file_path": str(file_path)}
