from contextlib import asynccontextmanager
from datetime import datetime, timezone
import json
import os
import secrets
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .models import init_db, get_db, User, SkillTree, Skill, UserProgress, Activity, ObsidianLink
from .xp_engine import (
    award_xp, initialize_progress_for_tree, get_tree_with_progress,
    get_user_progress_map, check_prerequisites
)


# --- Pydantic Models ---

class UserCreate(BaseModel):
    username: str
    display_name: Optional[str] = None

class UserOut(BaseModel):
    id: int
    username: str
    display_name: Optional[str]
    created_at: str
    class Config:
        from_attributes = True

class TreeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    is_template: bool = False

class TreeOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: Optional[str]
    is_template: bool
    created_at: str
    class Config:
        from_attributes = True

class SkillCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    x: float = 0.5
    y: float = 0.5
    xp_required: int = 0
    max_xp: int = 100
    icon: str = "⚙️"
    prerequisite_ids: List[int] = []

class SkillOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: Optional[str]
    x: float
    y: float
    xp_required: int
    max_xp: int
    icon: str
    prerequisite_ids: List[int]
    current_xp: int = 0
    status: str = "locked"
    class Config:
        from_attributes = True

class ActivityCreate(BaseModel):
    skill_id: int
    description: str
    xp_amount: int
    source: str = "manual"
    source_url: Optional[str] = None

class ActivityOut(BaseModel):
    id: int
    skill_id: Optional[int]
    description: str
    xp_amount: int
    source: str
    source_url: Optional[str]
    created_at: str
    class Config:
        from_attributes = True

class ObsidianSyncRequest(BaseModel):
    vault_path: str


# --- Auth Dependency ---

async def get_current_user(db: Session = Depends(get_db), x_api_key: Optional[str] = Header(None)):
    """Simple API key auth. Falls back to default user for local dev."""
    if x_api_key:
        user = db.query(User).filter(User.api_key == x_api_key).first()
        if user:
            return user
    # For local dev, return first user or create default
    user = db.query(User).first()
    if not user:
        user = User(username="default", display_name="Default User", api_key="dev-key")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


# --- App Lifecycle ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # Seed default tree if none exists
    db = next(get_db())
    try:
        if not db.query(SkillTree).first():
            _seed_default_tree(db)
    finally:
        db.close()
    yield


app = FastAPI(title="The Forge", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Seed Data ---

def _seed_default_tree(db: Session):
    """Create the default 'Empire Builder' tree with sample skills."""
    tree = SkillTree(
        name="Empire Builder",
        description="The complete skill tree for building an empire from zero.",
        category="business",
        is_template=True,
    )
    db.add(tree)
    db.commit()
    db.refresh(tree)

    # Define skill nodes
    skills_data = [
        # Root
        {"name": "Empire Builder", "description": "The foundation. You have decided to build.", "x": 0.5, "y": 0.05, "xp_required": 0, "max_xp": 50, "icon": "🏰", "category": "root", "prerequisite_ids": []},
        
        # Engineering Branch
        {"name": "React", "description": "Build user interfaces.", "x": 0.15, "y": 0.25, "xp_required": 10, "max_xp": 100, "icon": "⚡", "category": "engineering", "prerequisite_ids": []},
        {"name": "FastAPI", "description": "Build fast APIs.", "x": 0.25, "y": 0.25, "xp_required": 10, "max_xp": 100, "icon": "🚀", "category": "engineering", "prerequisite_ids": []},
        {"name": "System Design", "description": "Design scalable systems.", "x": 0.20, "y": 0.40, "xp_required": 50, "max_xp": 150, "icon": "🏗", "category": "engineering", "prerequisite_ids": [2, 3]},
        {"name": "AI/ML", "description": "Deploy intelligent systems.", "x": 0.20, "y": 0.55, "xp_required": 100, "max_xp": 200, "icon": "🤖", "category": "engineering", "prerequisite_ids": [4]},
        
        # Sales Branch
        {"name": "Cold Outreach", "description": "Start conversations with strangers.", "x": 0.40, "y": 0.25, "xp_required": 10, "max_xp": 80, "icon": "📞", "category": "sales", "prerequisite_ids": []},
        {"name": "Discovery", "description": "Uncover real pain points.", "x": 0.40, "y": 0.40, "xp_required": 40, "max_xp": 100, "icon": "🔍", "category": "sales", "prerequisite_ids": [6]},
        {"name": "Closing", "description": "Get the signature.", "x": 0.40, "y": 0.55, "xp_required": 80, "max_xp": 120, "icon": "✍️", "category": "sales", "prerequisite_ids": [7]},
        {"name": "Account Expansion", "description": "Grow existing accounts.", "x": 0.40, "y": 0.70, "xp_required": 120, "max_xp": 150, "icon": "📈", "category": "sales", "prerequisite_ids": [8]},
        
        # Operations Branch
        {"name": "Automation", "description": "Automate repetitive work.", "x": 0.60, "y": 0.25, "xp_required": 10, "max_xp": 100, "icon": "⚙️", "category": "operations", "prerequisite_ids": []},
        {"name": "Process Design", "description": "Design repeatable systems.", "x": 0.60, "y": 0.40, "xp_required": 50, "max_xp": 120, "icon": "📋", "category": "operations", "prerequisite_ids": [10]},
        {"name": "Team Building", "description": "Hire and lead teams.", "x": 0.60, "y": 0.55, "xp_required": 80, "max_xp": 150, "icon": "👥", "category": "operations", "prerequisite_ids": [11]},
        {"name": "Scaling", "description": "Scale the operation.", "x": 0.60, "y": 0.70, "xp_required": 130, "max_xp": 200, "icon": "🔮", "category": "operations", "prerequisite_ids": [12]},
        
        # Finance Branch
        {"name": "Personal Runway", "description": "Secure your financial base.", "x": 0.80, "y": 0.25, "xp_required": 10, "max_xp": 80, "icon": "💵", "category": "finance", "prerequisite_ids": []},
        {"name": "Unit Economics", "description": "Understand profit per unit.", "x": 0.80, "y": 0.40, "xp_required": 40, "max_xp": 100, "icon": "📊", "category": "finance", "prerequisite_ids": [14]},
        {"name": "Deal Structuring", "description": "Structure acquisitions.", "x": 0.80, "y": 0.55, "xp_required": 80, "max_xp": 150, "icon": "📄", "category": "finance", "prerequisite_ids": [15]},
        {"name": "Capital Raising", "description": "Raise investment capital.", "x": 0.80, "y": 0.70, "xp_required": 120, "max_xp": 200, "icon": "🏦", "category": "finance", "prerequisite_ids": [16]},
        
        # Leadership Branch
        {"name": "Decision Making", "description": "Make high-quality decisions fast.", "x": 0.50, "y": 0.25, "xp_required": 0, "max_xp": 100, "icon": "🎯", "category": "leadership", "prerequisite_ids": []},
        {"name": "Communication", "description": "Communicate vision clearly.", "x": 0.50, "y": 0.40, "xp_required": 40, "max_xp": 100, "icon": "📢", "category": "leadership", "prerequisite_ids": [18]},
        {"name": "Hiring", "description": "Recruit top talent.", "x": 0.50, "y": 0.55, "xp_required": 80, "max_xp": 120, "icon": "🤝", "category": "leadership", "prerequisite_ids": [19]},
        {"name": "Vision Setting", "description": "Define the future.", "x": 0.50, "y": 0.70, "xp_required": 120, "max_xp": 150, "icon": "💫", "category": "leadership", "prerequisite_ids": [20]},
    ]

    skill_map = {}  # temp index -> skill_id
    for i, data in enumerate(skills_data, start=1):
        skill = Skill(
            tree_id=tree.id,
            name=data["name"],
            description=data["description"],
            category=data["category"],
            x=data["x"],
            y=data["y"],
            xp_required=data["xp_required"],
            max_xp=data["max_xp"],
            icon=data["icon"],
            prerequisite_ids=json.dumps(data["prerequisite_ids"]),
        )
        db.add(skill)
        db.commit()
        db.refresh(skill)
        skill_map[i] = skill.id

    # Update prerequisite IDs to actual skill IDs
    for i, data in enumerate(skills_data, start=1):
        if data["prerequisite_ids"]:
            actual_ids = [skill_map[idx] for idx in data["prerequisite_ids"]]
            db.query(Skill).filter(Skill.id == skill_map[i]).update(
                {"prerequisite_ids": json.dumps(actual_ids)}
            )
    db.commit()

    return tree


# --- Routes ---

@app.get("/")
def root():
    return {"status": "ok", "service": "The Forge", "version": "0.1.0"}


# Users
@app.post("/users", response_model=UserOut)
def create_user(req: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == req.username).first()
    if existing:
        raise HTTPException(status_code=409, detail="Username taken")
    user = User(
        username=req.username,
        display_name=req.display_name or req.username,
        api_key=secrets.token_urlsafe(24),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.get("/users/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


# Trees
@app.get("/trees", response_model=List[TreeOut])
def list_trees(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    trees = db.query(SkillTree).filter(
        (SkillTree.is_template == True) | (SkillTree.user_id == user.id)
    ).all()
    return trees


@app.post("/trees", response_model=TreeOut)
def create_tree(req: TreeCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tree = SkillTree(
        user_id=user.id,
        name=req.name,
        description=req.description,
        category=req.category,
        is_template=req.is_template,
    )
    db.add(tree)
    db.commit()
    db.refresh(tree)
    return tree


@app.get("/trees/{tree_id}")
def get_tree(tree_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    data = get_tree_with_progress(db, tree_id, user.id)
    if not data:
        raise HTTPException(status_code=404, detail="Tree not found")
    return data


@app.post("/trees/{tree_id}/clone")
def clone_tree(tree_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    source = db.query(SkillTree).filter(SkillTree.id == tree_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Tree not found")
    
    new_tree = SkillTree(
        user_id=user.id,
        name=f"{source.name} (Clone)",
        description=source.description,
        category=source.category,
        is_template=False,
    )
    db.add(new_tree)
    db.commit()
    db.refresh(new_tree)
    
    # Clone skills
    old_skills = db.query(Skill).filter(Skill.tree_id == tree_id).all()
    id_map = {}
    for s in old_skills:
        new_skill = Skill(
            tree_id=new_tree.id,
            name=s.name,
            description=s.description,
            category=s.category,
            x=s.x,
            y=s.y,
            xp_required=s.xp_required,
            max_xp=s.max_xp,
            icon=s.icon,
            prerequisite_ids=s.prerequisite_ids,
        )
        db.add(new_skill)
        db.commit()
        db.refresh(new_skill)
        id_map[s.id] = new_skill.id
    
    # Remap prerequisite IDs
    for old_id, new_id in id_map.items():
        skill = db.query(Skill).filter(Skill.id == new_id).first()
        if skill:
            try:
                old_prereqs = json.loads(skill.prerequisite_ids or "[]")
                new_prereqs = [id_map[p] for p in old_prereqs if p in id_map]
                skill.prerequisite_ids = json.dumps(new_prereqs)
            except json.JSONDecodeError:
                pass
    db.commit()
    
    # Initialize progress
    initialize_progress_for_tree(db, user.id, new_tree.id)
    
    return {"tree_id": new_tree.id, "message": "Tree cloned successfully"}


# Skills
@app.get("/trees/{tree_id}/skills", response_model=List[SkillOut])
def list_skills(tree_id: int, db: Session = Depends(get_db)):
    skills = db.query(Skill).filter(Skill.tree_id == tree_id).all()
    return skills


@app.post("/trees/{tree_id}/skills", response_model=SkillOut)
def create_skill(tree_id: int, req: SkillCreate, db: Session = Depends(get_db)):
    tree = db.query(SkillTree).filter(SkillTree.id == tree_id).first()
    if not tree:
        raise HTTPException(status_code=404, detail="Tree not found")
    
    skill = Skill(
        tree_id=tree_id,
        name=req.name,
        description=req.description,
        category=req.category,
        x=req.x,
        y=req.y,
        xp_required=req.xp_required,
        max_xp=req.max_xp,
        icon=req.icon,
        prerequisite_ids=json.dumps(req.prerequisite_ids),
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


@app.put("/skills/{skill_id}", response_model=SkillOut)
def update_skill(skill_id: int, req: SkillCreate, db: Session = Depends(get_db)):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    skill.name = req.name
    skill.description = req.description
    skill.category = req.category
    skill.x = req.x
    skill.y = req.y
    skill.xp_required = req.xp_required
    skill.max_xp = req.max_xp
    skill.icon = req.icon
    skill.prerequisite_ids = json.dumps(req.prerequisite_ids)
    db.commit()
    db.refresh(skill)
    return skill


@app.delete("/skills/{skill_id}")
def delete_skill(skill_id: int, db: Session = Depends(get_db)):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    db.delete(skill)
    db.commit()
    return {"message": "Skill deleted"}


# Progress & Activities
@app.post("/activities")
def log_activity(req: ActivityCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    result = award_xp(
        db, user.id, req.skill_id, req.xp_amount,
        req.description, req.source, req.source_url
    )
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.get("/activities", response_model=List[ActivityOut])
def list_activities(
    skill_id: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    q = db.query(Activity).filter(Activity.user_id == user.id)
    if skill_id:
        q = q.filter(Activity.skill_id == skill_id)
    activities = q.order_by(Activity.created_at.desc()).limit(limit).all()
    return activities


@app.get("/progress")
def get_progress(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    progress = db.query(UserProgress).filter(UserProgress.user_id == user.id).all()
    total_xp = sum(p.current_xp for p in progress)
    unlocked = sum(1 for p in progress if p.status == "unlocked")
    mastered = sum(1 for p in progress if p.status == "mastered")
    return {
        "total_xp": total_xp,
        "skills_unlocked": unlocked,
        "skills_mastered": mastered,
        "total_skills": len(progress),
    }


@app.post("/trees/{tree_id}/init")
def init_tree_progress(tree_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    initialize_progress_for_tree(db, user.id, tree_id)
    return {"message": "Progress initialized"}


# Obsidian
@app.get("/obsidian/notes")
def list_obsidian_notes(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    notes = db.query(ObsidianLink).filter(ObsidianLink.user_id == user.id).order_by(ObsidianLink.last_sync.desc()).all()
    return notes


@app.post("/obsidian/sync")
def sync_obsidian(req: ObsidianSyncRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Stub for obsidian sync. Will scan vault in future."""
    return {"message": "Obsidian sync stub", "vault_path": req.vault_path}


# Stats
@app.get("/stats")
def get_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    trees_count = db.query(SkillTree).filter(SkillTree.user_id == user.id).count()
    activities_count = db.query(Activity).filter(Activity.user_id == user.id).count()
    progress = db.query(UserProgress).filter(UserProgress.user_id == user.id).all()
    total_xp = sum(p.current_xp for p in progress)
    mastered = sum(1 for p in progress if p.status == "mastered")
    unlocked = sum(1 for p in progress if p.status == "unlocked")
    
    return {
        "user": {"id": user.id, "username": user.username, "display_name": user.display_name},
        "trees_created": trees_count,
        "total_activities": activities_count,
        "total_xp": total_xp,
        "skills_unlocked": unlocked,
        "skills_mastered": mastered,
    }
