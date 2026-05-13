"""Seed default data."""
import json
from sqlalchemy.orm import Session

from app.models.models import SkillTree, Skill


DEFAULT_SKILLS = [
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


def seed_default_tree(db: Session):
    if db.query(SkillTree).first():
        return

    tree = SkillTree(
        name="Empire Builder",
        description="The complete skill tree for building an empire from zero.",
        category="business",
        is_template=True,
        is_public=True,
    )
    db.add(tree)
    db.commit()
    db.refresh(tree)

    skill_map = {}
    for i, data in enumerate(DEFAULT_SKILLS, start=1):
        skill = Skill(
            tree_id=tree.id,
            name=data["name"],
            description=data["description"],
            category=data["category"],
            x=data["x"], y=data["y"],
            xp_required=data["xp_required"],
            max_xp=data["max_xp"],
            icon=data["icon"],
            prerequisite_ids=json.dumps(data["prerequisite_ids"]),
        )
        db.add(skill)
        db.commit()
        db.refresh(skill)
        skill_map[i] = skill.id

    for i, data in enumerate(DEFAULT_SKILLS, start=1):
        if data["prerequisite_ids"]:
            actual_ids = [skill_map[idx] for idx in data["prerequisite_ids"]]
            db.query(Skill).filter(Skill.id == skill_map[i]).update(
                {"prerequisite_ids": json.dumps(actual_ids)}
            )
    db.commit()
