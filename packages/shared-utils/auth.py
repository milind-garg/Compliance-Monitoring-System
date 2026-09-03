from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from passlib.context import CryptContext

_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return _ctx.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return _ctx.verify(plain, hashed)


def create_access_token(
    subject: str,
    secret: str,
    algorithm: str = "HS256",
    expires_minutes: int = 60,
    extra: dict[str, Any] | None = None,
) -> str:
    payload = {
        "sub": subject,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=expires_minutes),
        **(extra or {}),
    }
    return jwt.encode(payload, secret, algorithm=algorithm)


def create_refresh_token(subject: str, secret: str, expires_days: int = 30) -> str:
    import uuid as _uuid
    payload = {
        "sub": subject,
        "type": "refresh",
        "jti": str(_uuid.uuid4()),  # guarantees uniqueness even within the same second
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=expires_days),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def decode_token(token: str, secret: str, algorithm: str = "HS256") -> dict[str, Any]:
    return jwt.decode(token, secret, algorithms=[algorithm])
