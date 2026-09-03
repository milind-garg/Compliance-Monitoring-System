"""FastAPI dependencies — current user extraction from Bearer JWT."""
import sys
sys.path.insert(0, "/app/shared_utils")

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import User
from exceptions import UnauthorizedError
from auth import decode_token

_bearer = HTTPBearer()


async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        payload = decode_token(creds.credentials, settings.jwt_secret_key, settings.jwt_algorithm)
    except Exception:
        raise UnauthorizedError()

    user_id = payload.get("sub")
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user or not user.is_active:
        raise UnauthorizedError()
    return user


def require_role(*roles: str):
    async def _check(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            from exceptions import ForbiddenError
            raise ForbiddenError()
        return user
    return _check
