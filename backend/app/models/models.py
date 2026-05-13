"""SQLAlchemy models."""
import json
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.base import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False, index=True)
    display_name = Column(String, nullable=True)
    api_key = Column(String, unique=True, nullable=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_active = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    trees = relationship("SkillTree", back_populates="user", cascade="all, delete-orphan")
    progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="user", cascade="all, delete-orphan")
    obsidian_links = relationship("ObsidianLink", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    progress_notes = relationship("ProgressNote", back_populates="user", cascade="all, delete-orphan")


class SkillTree(Base):
    __tablename__ = "skill_trees"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    is_template = Column(Boolean, default=False)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="trees")
    skills = relationship("Skill", back_populates="tree", cascade="all, delete-orphan")


class Skill(Base):
    __tablename__ = "skills"
    id = Column(Integer, primary_key=True, autoincrement=True)
    tree_id = Column(Integer, ForeignKey("skill_trees.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    x = Column(Float, default=0.5)
    y = Column(Float, default=0.5)
    xp_required = Column(Integer, default=0)
    prerequisite_ids = Column(Text, default="[]")
    max_xp = Column(Integer, default=100)
    icon = Column(String, default="⚙️")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    tree = relationship("SkillTree", back_populates="skills")
    progress_entries = relationship("UserProgress", back_populates="skill", cascade="all, delete-orphan")


class UserProgress(Base):
    __tablename__ = "user_progress"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False, index=True)
    current_xp = Column(Integer, default=0)
    status = Column(String, default="locked")
    unlocked_at = Column(DateTime, nullable=True)
    mastered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (UniqueConstraint("user_id", "skill_id", name="uix_user_skill"),)

    user = relationship("User", back_populates="progress")
    skill = relationship("Skill", back_populates="progress_entries")


class Activity(Base):
    __tablename__ = "activities"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=True, index=True)
    description = Column(Text, nullable=False)
    xp_amount = Column(Integer, default=0)
    source = Column(String, default="manual")
    source_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="activities")
    skill = relationship("Skill")


class ObsidianLink(Base):
    __tablename__ = "obsidian_links"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    vault_path = Column(String, nullable=False)
    note_title = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    tags = Column(Text, default="[]")
    links = Column(Text, default="[]")
    extracted_activities = Column(Text, default="[]")
    word_count = Column(Integer, default=0)
    last_sync = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="obsidian_links")


class Goal(Base):
    __tablename__ = "goals"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    target_value = Column(Integer, default=100)
    current_value = Column(Integer, default=0)
    status = Column(String, default="active")  # active, completed, paused
    target_date = Column(DateTime, nullable=True)
    linked_tree_id = Column(Integer, ForeignKey("skill_trees.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="goals")


class ProgressNote(Base):
    __tablename__ = "progress_notes"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    tags = Column(Text, default="[]")
    linked_skill_id = Column(Integer, ForeignKey("skills.id"), nullable=True)
    linked_tree_id = Column(Integer, ForeignKey("skill_trees.id"), nullable=True)
    mood = Column(String, nullable=True)  # great, good, okay, tough
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="progress_notes")
