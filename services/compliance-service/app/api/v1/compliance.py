import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import ComplianceRecord
from app.schemas import ComplianceRecordCreate, ComplianceRecordOut

router = APIRouter(prefix="/compliance", tags=["compliance"])


@router.get("/", response_model=list[ComplianceRecordOut])
async def list_records(mine_id: uuid.UUID | None = None, db: AsyncSession = Depends(get_db)):
    q = select(ComplianceRecord)
    if mine_id:
        q = q.where(ComplianceRecord.mine_id == mine_id)
    return (await db.execute(q.order_by(ComplianceRecord.created_at.desc()).limit(100))).scalars().all()


@router.post("/", response_model=ComplianceRecordOut, status_code=201)
async def create_record(body: ComplianceRecordCreate, db: AsyncSession = Depends(get_db)):
    overall = (body.safety_score + body.environmental_score + body.labour_score) / Decimal(3)
    record = ComplianceRecord(
        **body.model_dump(),
        overall_score=overall.quantize(Decimal("0.01")),
        status="compliant" if overall >= 70 else "non_compliant",
        created_by=uuid.uuid4(),  # ponytail: real impl extracts from JWT
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.get("/{record_id}", response_model=ComplianceRecordOut)
async def get_record(record_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(ComplianceRecord).where(ComplianceRecord.id == record_id))).scalar_one_or_none()
    if not r:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
    return r
