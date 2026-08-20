"""Application configuration."""
import os
from typing import List


class Settings:
    PROJECT_NAME: str = "The Forge"
    VERSION: str = "0.2.0"
    DESCRIPTION: str = "Gamified skill tree and goal tracker for empire builders."

    # Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATA_DIR: str = os.path.join(BASE_DIR, "data")
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(DATA_DIR, 'forge.db')}")

    # Security
    API_KEY_HEADER: str = "x-api-key"
    DEV_MODE: bool = os.getenv("FORGE_DEV_MODE", "true").lower() == "true"
    CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "*").split(",")

    # Obsidian
    DEFAULT_VAULT_PATH: str = os.getenv("DEFAULT_VAULT_PATH", "./data/obsidian-vault")

    # XP / Game
    BASE_LEVEL_XP: int = 100
    LEVEL_SCALING: float = 1.5


settings = Settings()

# Ensure data directory exists
os.makedirs(settings.DATA_DIR, exist_ok=True)
