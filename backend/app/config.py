from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DB_PATH = BASE_DIR / "qpon.db"


@dataclass(frozen=True)
class Settings:
    app_name: str = "QPON API"
    database_url: str = os.getenv("QPON_DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH.as_posix()}")
    jwt_secret: str = os.getenv("QPON_JWT_SECRET", "dev-secret-change-me-please-replace-32b")
    token_ttl_minutes: int = int(os.getenv("QPON_TOKEN_TTL_MINUTES", "720"))


settings = Settings()
