import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Inspection
from app.schemas import InspectionCreate, InspectionOut

router = APIRouter(prefix="/inspections", tags=["inspections"])


@router.get("/", response_model=list[InspectionOut])
async def list_inspections(
    mine_id: uuid.UUID | None = None,
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(Inspection)
    if mine_id:
        q = q.where(Inspection.mine_id == mine_id)
    if status:
        q = q.where(Inspection.status == status)
    return (await db.execute(q.order_by(Inspection.scheduled_at.desc()).limit(100))).scalars().all()


@router.post("/", response_model=InspectionOut, status_code=201)
async def create_inspection(body: InspectionCreate, db: AsyncSession = Depends(get_db)):
    obj = Inspection(**body.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.patch("/{inspection_id}/complete", response_model=InspectionOut)
async def complete_inspection(
    inspection_id: uuid.UUID,
    findings: str = "",
    recommendations: str = "",
    db: AsyncSession = Depends(get_db),
):
    obj = (await db.execute(select(Inspection).where(Inspection.id == inspection_id))).scalar_one_or_none()
    if not obj:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
    obj.status = "completed"
    obj.completed_at = datetime.now(timezone.utc)
    obj.findings = findings
    obj.recommendations = recommendations
    await db.commit()
    await db.refresh(obj)
    return obj
