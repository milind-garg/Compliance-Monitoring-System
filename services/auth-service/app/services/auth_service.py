import hashlib
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import Organisation, RefreshToken, User
from app.schemas import LoginRequest, RegisterRequest, TokenResponse

import sys, os
sys.path.insert(0, "/app/shared_utils")
from auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from exceptions import ConflictError, NotFoundError, UnauthorizedError


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


async def register(req: RegisterRequest, db: AsyncSession) -> TokenResponse:
    existing = (await db.execute(select(User).where(User.email == req.email))).scalar_one_or_none()
    if existing:
        raise ConflictError("Email already registered")

    org = Organisation(name=req.organisation_name, code=req.organisation_code)
    db.add(org)
    await db.flush()

    user = User(
        organisation_id=org.id,
        email=req.email,
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name,
        role=req.role,
    )
    db.add(user)
    await db.flush()

    return await _issue_tokens(user, db)


async def login(req: LoginRequest, db: AsyncSession) -> TokenResponse:
    user = (await db.execute(select(User).where(User.email == req.email))).scalar_one_or_none()
    if not user or not verify_password(req.password, user.hashed_password):
        raise UnauthorizedError("Invalid credentials")
    if not user.is_active:
        raise UnauthorizedError("Account disabled")

    user.last_login = datetime.now(timezone.utc)
    return await _issue_tokens(user, db)


async def refresh(token: str, db: AsyncSession) -> TokenResponse:
    try:
        payload = decode_token(token, settings.jwt_secret_key, settings.jwt_algorithm)
    except Exception:
        raise UnauthorizedError("Invalid refresh token")

    if payload.get("type") != "refresh":
        raise UnauthorizedError("Not a refresh token")

    token_hash = _hash(token)
    stored = (
        await db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked.is_(False),
            )
        )
    ).scalar_one_or_none()

    if not stored or stored.expires_at < datetime.now(timezone.utc):
        raise UnauthorizedError("Refresh token expired or revoked")

    stored.revoked = True  # rotate
    user = (await db.execute(select(User).where(User.id == stored.user_id))).scalar_one()
    return await _issue_tokens(user, db)


async def _issue_tokens(user: User, db: AsyncSession) -> TokenResponse:
    access = create_access_token(
        subject=str(user.id),
        secret=settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
        expires_minutes=settings.access_token_expire_minutes,
        extra={"role": user.role, "org_id": str(user.organisation_id)},
    )
    refresh_tok = create_refresh_token(
        subject=str(user.id),
        secret=settings.jwt_secret_key,
        expires_days=settings.refresh_token_expire_days,
    )
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=_hash(refresh_tok),
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days),
        )
    )
    await db.commit()
    return TokenResponse(access_token=access, refresh_token=refresh_tok)
