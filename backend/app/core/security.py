"""Security utilities."""
import secrets
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional


def generate_api_key() -> str:
    return "fk_" + secrets.token_urlsafe(32)


def hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


def now() -> datetime:
    return datetime.now(timezone.utc)


def days_ago(n: int) -> datetime:
    return now() - timedelta(days=n)
