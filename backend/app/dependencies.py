from __future__ import annotations

from datetime import datetime, timezone

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import get_db
from .models import Company, CompanyMembership, CompanySubscription, User
from .security import decode_access_token


ACTIVE_STATUSES = {"active", "trialing"}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def normalize_datetime(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def get_bearer_token(authorization: str = Header(default="")) -> str:
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    return token.strip()


def get_current_user(
    token: str = Depends(get_bearer_token),
    session: Session = Depends(get_db),
) -> User:
    try:
        payload = decode_access_token(token)
        user_id = int(payload["sub"])
    except Exception as exc:  # pragma: no cover - API boundary
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_company_member(company_id: int, user: User, session: Session) -> Company:
    company = session.get(Company, company_id)
    if company is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

    membership = session.scalar(
        select(CompanyMembership).where(
            CompanyMembership.company_id == company_id,
            CompanyMembership.user_id == user.id,
        )
    )
    if membership is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Company access denied")
    return company


def require_company_plan(company_id: int, product_code: str, session: Session) -> None:
    now = utc_now()
    subscription = session.scalar(
        select(CompanySubscription).where(
            CompanySubscription.company_id == company_id,
            CompanySubscription.product_code == product_code,
            CompanySubscription.status.in_(ACTIVE_STATUSES),
        )
    )
    if subscription is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Required subscription is inactive")
    current_period_end = normalize_datetime(subscription.current_period_end)
    if current_period_end and current_period_end < now:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Required subscription is expired")
