import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class ComplianceRecordOut(BaseModel):
    id: uuid.UUID
    mine_id: uuid.UUID
    period_start: datetime
    period_end: datetime
    overall_score: Decimal
    safety_score: Decimal
    environmental_score: Decimal
    labour_score: Decimal
    status: str
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ComplianceRecordCreate(BaseModel):
    mine_id: uuid.UUID
    period_start: datetime
    period_end: datetime
    safety_score: Decimal
    environmental_score: Decimal
    labour_score: Decimal
    notes: str | None = None
