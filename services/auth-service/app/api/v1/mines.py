import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Mine, User
from app.schemas import MineCreate, MineOut
from app.utils.deps import get_current_user, require_role

import sys
sys.path.insert(0, "/app/shared_utils")
from exceptions import NotFoundError

router = APIRouter(prefix="/mines", tags=["mines"])


@router.get("/", response_model=list[MineOut])
async def list_mines(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = (
        await db.execute(
            select(Mine).where(Mine.organisation_id == user.organisation_id, Mine.is_active.is_(True))
        )
    ).scalars().all()
    return rows


@router.post("/", response_model=MineOut, status_code=201)
async def create_mine(
    body: MineCreate,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_role("admin", "manager")),
):
    mine = Mine(organisation_id=actor.organisation_id, **body.model_dump())
    db.add(mine)
    await db.commit()
    await db.refresh(mine)
    return mine


@router.get("/{mine_id}", response_model=MineOut)
async def get_mine(
    mine_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    mine = (
        await db.execute(
            select(Mine).where(Mine.id == mine_id, Mine.organisation_id == user.organisation_id)
        )
    ).scalar_one_or_none()
    if not mine:
        raise NotFoundError("Mine not found")
    return mine
