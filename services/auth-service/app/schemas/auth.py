import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    organisation_name: str
    organisation_code: str
    role: str = "admin"

    @field_validator("password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    organisation_id: uuid.UUID
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MineOut(BaseModel):
    id: uuid.UUID
    name: str
    location: str
    latitude: float | None
    longitude: float | None
    mine_type: str
    is_active: bool

    model_config = {"from_attributes": True}


class MineCreate(BaseModel):
    name: str
    location: str
    latitude: float | None = None
    longitude: float | None = None
    mine_type: str = "underground"


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "viewer"
