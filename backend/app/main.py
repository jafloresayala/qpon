from __future__ import annotations

from datetime import timedelta
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from .config import settings
from .database import Base, SessionLocal, engine, get_db
from .dependencies import (
    get_current_user,
    normalize_datetime,
    require_company_member,
    require_company_plan,
    utc_now,
)
from .models import (
    Company,
    CompanyMembership,
    CompanySubscription,
    PetDefinition,
    QRCampaign,
    Redemption,
    SubscriptionProduct,
    User,
    UserCompanyProgress,
    UserDiscount,
    UserPet,
)
from .schemas import (
    CampaignCreateRequest,
    CampaignResponse,
    CompanyResponse,
    InventoryDiscountResponse,
    InventoryPetResponse,
    InventoryResponse,
    LoginRequest,
    MockSubscriptionRequest,
    ProductResponse,
    RedeemRequest,
    RedeemResponse,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from .security import create_access_token, generate_qr_code, hash_password, verify_password


app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def slugify(value: str) -> str:
    chars = [char.lower() if char.isalnum() else "-" for char in value.strip()]
    slug = "".join(chars)
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-") or generate_qr_code("company")


def seed_products(session: Session) -> None:
    existing = {product.code for product in session.scalars(select(SubscriptionProduct)).all()}
    catalog = [
        SubscriptionProduct(
            code="discount_basic",
            name="Discount Plan",
            description="Habilita QR de descuentos por 5 USD al mes.",
            monthly_price_usd=5,
        ),
        SubscriptionProduct(
            code="pet_3d",
            name="3D Pet Plan",
            description="Habilita QR de mascotas 3D por 50 USD al mes.",
            monthly_price_usd=50,
        ),
    ]
    created = False
    for product in catalog:
        if product.code not in existing:
            session.add(product)
            created = True
    if created:
        session.commit()


def initialize_database() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        seed_products(session)


initialize_database()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, session: Session = Depends(get_db)) -> TokenResponse:
    if session.scalar(select(User).where(User.email == payload.email)) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    if payload.role == "company" and not payload.company_name:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="company_name is required")

    now = utc_now()
    user = User(
        name=payload.name.strip(),
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        created_at=now,
    )
    session.add(user)
    session.flush()

    if payload.role == "company":
        slug_base = slugify(payload.company_name or payload.name)
        slug = slug_base
        suffix = 1
        while session.scalar(select(Company).where(Company.slug == slug)) is not None:
            suffix += 1
            slug = f"{slug_base}-{suffix}"
        company = Company(
            name=(payload.company_name or payload.name).strip(),
            slug=slug,
            owner_user_id=user.id,
            created_at=now,
        )
        session.add(company)
        session.flush()
        session.add(
            CompanyMembership(
                user_id=user.id,
                company_id=company.id,
                role="owner",
                created_at=now,
            )
        )

    session.commit()
    session.refresh(user)
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@app.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, session: Session = Depends(get_db)) -> TokenResponse:
    user = session.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@app.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)


@app.get("/products", response_model=list[ProductResponse])
def list_products(session: Session = Depends(get_db)) -> list[ProductResponse]:
    products = session.scalars(select(SubscriptionProduct).order_by(SubscriptionProduct.monthly_price_usd)).all()
    return [ProductResponse.model_validate(product, from_attributes=True) for product in products]


@app.get("/companies", response_model=list[CompanyResponse])
def list_companies(current_user: User = Depends(get_current_user), session: Session = Depends(get_db)) -> list[CompanyResponse]:
    companies = session.scalars(
        select(Company)
        .join(CompanyMembership, CompanyMembership.company_id == Company.id)
        .where(CompanyMembership.user_id == current_user.id)
        .order_by(Company.created_at.desc())
    ).all()
    return [CompanyResponse.model_validate(company) for company in companies]


@app.post("/companies/{company_id}/subscriptions/mock-activate")
def mock_activate_subscription(
    company_id: int,
    payload: MockSubscriptionRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> dict[str, Any]:
    require_company_member(company_id, current_user, session)
    now = utc_now()
    subscription = session.scalar(
        select(CompanySubscription).where(
            CompanySubscription.company_id == company_id,
            CompanySubscription.product_code == payload.product_code,
        )
    )
    if subscription is None:
        subscription = CompanySubscription(
            company_id=company_id,
            product_code=payload.product_code,
            status="active",
            current_period_end=now + timedelta(days=payload.days),
            provider="mock",
            created_at=now,
        )
        session.add(subscription)
    else:
        subscription.status = "active"
        subscription.current_period_end = now + timedelta(days=payload.days)
    session.commit()
    return {
        "company_id": company_id,
        "product_code": payload.product_code,
        "status": subscription.status,
        "current_period_end": subscription.current_period_end,
        "provider": subscription.provider,
    }


@app.post("/companies/{company_id}/campaigns", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(
    company_id: int,
    payload: CampaignCreateRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> CampaignResponse:
    require_company_member(company_id, current_user, session)
    if payload.ends_at and payload.starts_at and payload.ends_at <= payload.starts_at:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid campaign window")

    if payload.reward_type == "discount":
        require_company_plan(company_id, "discount_basic", session)
        if payload.discount_percentage is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="discount_percentage is required")
        pet_definition_id = None
        pet_is_permanent = False
        pet_duration_days = None
    else:
        require_company_plan(company_id, "pet_3d", session)
        if not payload.pet_name or not payload.pet_slug:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="pet_name and pet_slug are required")
        if not payload.pet_is_permanent and payload.pet_duration_days is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="pet_duration_days is required when pet is not permanent")
        pet_definition = session.scalar(select(PetDefinition).where(PetDefinition.slug == payload.pet_slug))
        if pet_definition is None:
            pet_definition = PetDefinition(
                name=payload.pet_name,
                slug=payload.pet_slug,
                asset_url=payload.pet_asset_url,
                rarity=payload.pet_rarity or "common",
                base_attack=payload.pet_base_attack or 10,
                base_defense=payload.pet_base_defense or 10,
                created_at=utc_now(),
            )
            session.add(pet_definition)
            session.flush()
        pet_definition_id = pet_definition.id
        pet_is_permanent = payload.pet_is_permanent
        pet_duration_days = None if payload.pet_is_permanent else payload.pet_duration_days

    now = utc_now()
    candidate_code = (payload.code or generate_qr_code()).strip()
    while session.scalar(select(QRCampaign).where(QRCampaign.code == candidate_code)) is not None:
        candidate_code = generate_qr_code()

    campaign = QRCampaign(
        company_id=company_id,
        created_by_user_id=current_user.id,
        code=candidate_code,
        title=payload.title.strip(),
        description=(payload.description or "").strip() or None,
        reward_type=payload.reward_type,
        max_redemptions=payload.max_redemptions,
        redeemed_count=0,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        discount_percentage=payload.discount_percentage if payload.reward_type == "discount" else None,
        pet_definition_id=pet_definition_id,
        pet_duration_days=pet_duration_days,
        pet_is_permanent=pet_is_permanent,
        created_at=now,
    )
    session.add(campaign)
    session.commit()
    session.refresh(campaign)
    return CampaignResponse.model_validate(campaign)


def serialize_pet(pet: UserPet) -> InventoryPetResponse:
    definition = pet.pet_definition
    return InventoryPetResponse(
        id=pet.id,
        campaign_id=pet.campaign_id,
        pet_definition_id=pet.pet_definition_id,
        pet_name=definition.name,
        pet_slug=definition.slug,
        asset_url=definition.asset_url,
        rarity=definition.rarity,
        base_attack=definition.base_attack,
        base_defense=definition.base_defense,
        is_permanent=pet.is_permanent,
        expires_at=pet.expires_at,
        granted_at=pet.granted_at,
    )


@app.post("/redeem", response_model=RedeemResponse)
def redeem_campaign(
    payload: RedeemRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> RedeemResponse:
    now = utc_now()
    campaign = session.scalar(
        select(QRCampaign)
        .options(joinedload(QRCampaign.pet_definition))
        .where(QRCampaign.code == payload.code)
    )
    if campaign is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    starts_at = normalize_datetime(campaign.starts_at)
    ends_at = normalize_datetime(campaign.ends_at)
    if starts_at and starts_at > now:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Campaign not active yet")
    if ends_at and ends_at < now:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Campaign expired")
    if campaign.redeemed_count >= campaign.max_redemptions:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Campaign fully redeemed")
    existing = session.scalar(
        select(Redemption).where(
            Redemption.campaign_id == campaign.id,
            Redemption.user_id == current_user.id,
        )
    )
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already redeemed this campaign")

    redemption = Redemption(campaign_id=campaign.id, user_id=current_user.id, redeemed_at=now)
    session.add(redemption)
    campaign.redeemed_count += 1

    progress = session.scalar(
        select(UserCompanyProgress).where(
            UserCompanyProgress.user_id == current_user.id,
            UserCompanyProgress.company_id == campaign.company_id,
        )
    )
    if progress is None:
        progress = UserCompanyProgress(
            user_id=current_user.id,
            company_id=campaign.company_id,
            total_scans=1,
            updated_at=now,
            created_at=now,
        )
        session.add(progress)
    else:
        progress.total_scans += 1
        progress.updated_at = now

    if campaign.reward_type == "discount":
        discount = UserDiscount(
            user_id=current_user.id,
            campaign_id=campaign.id,
            title=campaign.title,
            description=campaign.description,
            discount_percentage=campaign.discount_percentage or 0,
            status="active",
            expires_at=ends_at,
            granted_at=now,
            created_at=now,
        )
        session.add(discount)
        session.commit()
        session.refresh(discount)
        return RedeemResponse(
            message="Discount redeemed successfully",
            reward_type="discount",
            discount=InventoryDiscountResponse.model_validate(discount),
        )

    if campaign.pet_definition is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Campaign pet is missing")

    expires_at = None if campaign.pet_is_permanent else now + timedelta(days=campaign.pet_duration_days or 0)
    pet = UserPet(
        user_id=current_user.id,
        campaign_id=campaign.id,
        pet_definition_id=campaign.pet_definition.id,
        is_permanent=campaign.pet_is_permanent,
        expires_at=expires_at,
        granted_at=now,
        created_at=now,
    )
    session.add(pet)
    session.commit()
    session.refresh(pet)
    session.refresh(campaign)
    return RedeemResponse(
        message="Pet redeemed successfully",
        reward_type="pet",
        pet=serialize_pet(pet),
    )


@app.get("/inventory", response_model=InventoryResponse)
def inventory(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> InventoryResponse:
    now = utc_now()
    discounts = session.scalars(
        select(UserDiscount)
        .where(UserDiscount.user_id == current_user.id)
        .where(or_(UserDiscount.expires_at.is_(None), UserDiscount.expires_at >= now))
        .order_by(UserDiscount.granted_at.desc())
    ).all()
    pets = session.scalars(
        select(UserPet)
        .options(joinedload(UserPet.pet_definition))
        .where(UserPet.user_id == current_user.id)
        .where(or_(UserPet.is_permanent.is_(True), UserPet.expires_at >= now))
        .order_by(UserPet.granted_at.desc())
    ).all()
    return InventoryResponse(
        discounts=[InventoryDiscountResponse.model_validate(item) for item in discounts],
        pets=[serialize_pet(item) for item in pets],
    )
