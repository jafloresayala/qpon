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
    allowed_origins: list[str] = None  # type: ignore[assignment]

    def __post_init__(self) -> None:
        raw = os.getenv("QPON_ALLOWED_ORIGINS", "")
        extra = [o.strip() for o in raw.split(",") if o.strip()]
        default = [
            "http://localhost:8081",
            "http://localhost:8082",
            "http://127.0.0.1:8081",
            "http://127.0.0.1:8082",
            "http://localhost:19006",
            "http://127.0.0.1:19006",
        ]
        object.__setattr__(self, "allowed_origins", default + extra)


settings = Settings()
