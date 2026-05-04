from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)


class Company(TimestampMixin, Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(140), nullable=False, unique=True)
    owner_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)


class CompanyMembership(TimestampMixin, Base):
    __tablename__ = "company_memberships"
    __table_args__ = (UniqueConstraint("user_id", "company_id", name="uq_company_membership"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)


class SubscriptionProduct(Base):
    __tablename__ = "subscription_products"

    code: Mapped[str] = mapped_column(String(40), primary_key=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    monthly_price_usd: Mapped[int] = mapped_column(Integer, nullable=False)


class CompanySubscription(TimestampMixin, Base):
    __tablename__ = "company_subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), nullable=False)
    product_code: Mapped[str] = mapped_column(ForeignKey("subscription_products.code"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    provider: Mapped[str] = mapped_column(String(40), nullable=False, default="mock")


class PetDefinition(TimestampMixin, Base):
    __tablename__ = "pet_definitions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    slug: Mapped[str] = mapped_column(String(80), nullable=False, unique=True)
    asset_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    rarity: Mapped[str] = mapped_column(String(40), nullable=False)
    base_attack: Mapped[int] = mapped_column(Integer, nullable=False)
    base_defense: Mapped[int] = mapped_column(Integer, nullable=False)


class QRCampaign(TimestampMixin, Base):
    __tablename__ = "qr_campaigns"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), nullable=False)
    created_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    code: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    reward_type: Mapped[str] = mapped_column(String(20), nullable=False)
    max_redemptions: Mapped[int] = mapped_column(Integer, nullable=False)
    redeemed_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    discount_percentage: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pet_definition_id: Mapped[int | None] = mapped_column(ForeignKey("pet_definitions.id"), nullable=True)
    pet_duration_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pet_is_permanent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    pet_definition: Mapped[PetDefinition | None] = relationship()


class UserDiscount(TimestampMixin, Base):
    __tablename__ = "user_discounts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("qr_campaigns.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    discount_percentage: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class UserPet(TimestampMixin, Base):
    __tablename__ = "user_pets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("qr_campaigns.id"), nullable=False)
    pet_definition_id: Mapped[int] = mapped_column(ForeignKey("pet_definitions.id"), nullable=False)
    is_permanent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    pet_definition: Mapped[PetDefinition] = relationship()


class Redemption(Base):
    __tablename__ = "redemptions"
    __table_args__ = (UniqueConstraint("campaign_id", "user_id", name="uq_redemption_campaign_user"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("qr_campaigns.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    redeemed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class UserCompanyProgress(TimestampMixin, Base):
    __tablename__ = "user_company_progress"
    __table_args__ = (UniqueConstraint("user_id", "company_id", name="uq_user_company_progress"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), nullable=False)
    total_scans: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
