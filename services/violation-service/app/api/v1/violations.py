import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Violation
from app.schemas import ViolationCreate, ViolationOut

router = APIRouter(prefix="/violations", tags=["violations"])


@router.get("/", response_model=list[ViolationOut])
async def list_violations(
    mine_id: uuid.UUID | None = None,
    status: str | None = None,
    severity: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(Violation)
    if mine_id:
        q = q.where(Violation.mine_id == mine_id)
    if status:
        q = q.where(Violation.status == status)
    if severity:
        q = q.where(Violation.severity == severity)
    return (await db.execute(q.order_by(Violation.created_at.desc()).limit(200))).scalars().all()


@router.post("/", response_model=ViolationOut, status_code=201)
async def create_violation(body: ViolationCreate, db: AsyncSession = Depends(get_db)):
    obj = Violation(**body.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.patch("/{violation_id}/resolve", response_model=ViolationOut)
async def resolve_violation(
    violation_id: uuid.UUID,
    resolved_by: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    obj = (await db.execute(select(Violation).where(Violation.id == violation_id))).scalar_one_or_none()
    if not obj:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
    obj.status = "resolved"
    obj.resolved_at = datetime.now(timezone.utc)
    obj.resolved_by = resolved_by
    await db.commit()
    await db.refresh(obj)
    return obj
