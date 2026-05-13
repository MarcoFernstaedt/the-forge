"""Pydantic schemas."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


# --- User ---
class UserCreate(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    display_name: Optional[str] = Field(None, max_length=100)


class UserOut(BaseModel):
    id: int
    username: str
    display_name: Optional[str]
    api_key: Optional[str]
    created_at: datetime
    last_active: Optional[datetime]

    class Config:
        from_attributes = True


# --- Skill Tree ---
class TreeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None, max_length=50)
    is_template: bool = False
    is_public: bool = False


class TreeOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: Optional[str]
    is_template: bool
    is_public: bool
    created_at: datetime
    updated_at: Optional[datetime]
    skill_count: int = 0

    class Config:
        from_attributes = True


# --- Skill ---
class SkillCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None, max_length=50)
    x: float = Field(0.5, ge=0.0, le=1.0)
    y: float = Field(0.5, ge=0.0, le=1.0)
    xp_required: int = Field(0, ge=0)
    max_xp: int = Field(100, ge=1)
    icon: str = Field("⚙️", max_length=10)
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
    unlocked_at: Optional[datetime] = None
    mastered_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Activity ---
class ActivityCreate(BaseModel):
    skill_id: int
    description: str = Field(..., min_length=1, max_length=500)
    xp_amount: int = Field(..., ge=1, le=1000)
    source: str = "manual"
    source_url: Optional[str] = None


class ActivityOut(BaseModel):
    id: int
    skill_id: Optional[int]
    description: str
    xp_amount: int
    source: str
    source_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# --- Progress ---
class ProgressOut(BaseModel):
    total_xp: int
    skills_unlocked: int
    skills_mastered: int
    total_skills: int
    current_level: int
    level_progress: float
    streak_days: int
    longest_streak: int


# --- Obsidian ---
class ObsidianSyncRequest(BaseModel):
    vault_path: Optional[str] = None


class ObsidianNoteOut(BaseModel):
    id: int
    note_title: str
    vault_path: str
    file_path: str
    tags: List[str]
    links: List[str]
    extracted_activities: List[str]
    word_count: int
    last_sync: datetime

    @field_validator('tags', 'links', 'extracted_activities', mode='before')
    @classmethod
    def parse_json(cls, v):
        if isinstance(v, str):
            import json
            return json.loads(v)
        return v

    class Config:
        from_attributes = True


class ObsidianGraphNode(BaseModel):
    id: str
    label: str
    group: str
    val: int = 1


class ObsidianGraphLink(BaseModel):
    source: str
    target: str


class ObsidianGraphOut(BaseModel):
    nodes: List[ObsidianGraphNode]
    links: List[ObsidianGraphLink]


# --- Stats ---
class StatsOut(BaseModel):
    user: UserOut
    trees_created: int
    total_activities: int
    total_xp: int
    skills_unlocked: int
    skills_mastered: int
    current_level: int
    next_level_xp: int
    streak_days: int
    longest_streak: int
