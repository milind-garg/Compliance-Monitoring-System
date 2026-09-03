from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse
from app.services.auth_service import login, refresh, register

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register_endpoint(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    return await register(body, db)


@router.post("/login", response_model=TokenResponse)
async def login_endpoint(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await login(body, db)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_endpoint(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    return await refresh(body.refresh_token, db)
