from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


UserRole = Literal["user", "company"]
RewardType = Literal["discount", "pet"]
SubscriptionProductCode = Literal["discount_basic", "pet_3d"]


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=120)
    role: UserRole
    company_name: str | None = Field(default=None, min_length=2, max_length=120)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=120)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: UserRole
    created_at: datetime


class ProductResponse(BaseModel):
    code: SubscriptionProductCode
    name: str
    monthly_price_usd: int
    description: str


class CompanyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    owner_user_id: int
    created_at: datetime


class MockSubscriptionRequest(BaseModel):
    product_code: SubscriptionProductCode
    days: int = Field(default=30, ge=1, le=365)


class CampaignCreateRequest(BaseModel):
    title: str = Field(min_length=3, max_length=160)
    description: str | None = Field(default=None, max_length=500)
    reward_type: RewardType
    max_redemptions: int = Field(ge=1, le=1_000_000)
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    discount_percentage: int | None = Field(default=None, ge=1, le=100)
    pet_name: str | None = Field(default=None, min_length=2, max_length=80)
    pet_slug: str | None = Field(default=None, min_length=2, max_length=80)
    pet_asset_url: str | None = Field(default=None, max_length=500)
    pet_rarity: str | None = Field(default="common", max_length=40)
    pet_base_attack: int | None = Field(default=10, ge=1, le=999)
    pet_base_defense: int | None = Field(default=10, ge=1, le=999)
    pet_duration_days: int | None = Field(default=None, ge=1, le=365)
    pet_is_permanent: bool = False
    code: str | None = Field(default=None, min_length=4, max_length=120)


class CampaignResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_id: int
    code: str
    title: str
    description: str | None
    reward_type: RewardType
    max_redemptions: int
    redeemed_count: int
    starts_at: datetime | None
    ends_at: datetime | None
    created_at: datetime


class RedeemRequest(BaseModel):
    code: str = Field(min_length=4, max_length=120)


class InventoryDiscountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    discount_percentage: int
    status: str
    expires_at: datetime | None
    granted_at: datetime


class InventoryPetResponse(BaseModel):
    id: int
    campaign_id: int
    pet_definition_id: int
    pet_name: str
    pet_slug: str
    asset_url: str | None
    rarity: str
    base_attack: int
    base_defense: int
    is_permanent: bool
    expires_at: datetime | None
    granted_at: datetime


class InventoryResponse(BaseModel):
    discounts: list[InventoryDiscountResponse]
    pets: list[InventoryPetResponse]


class RedeemResponse(BaseModel):
    message: str
    reward_type: RewardType
    discount: InventoryDiscountResponse | None = None
    pet: InventoryPetResponse | None = None


TokenResponse.model_rebuild()
