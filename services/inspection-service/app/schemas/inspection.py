import uuid
from datetime import datetime
from pydantic import BaseModel


class InspectionOut(BaseModel):
    id: uuid.UUID
    mine_id: uuid.UUID
    inspector_id: uuid.UUID
    inspection_type: str
    scheduled_at: datetime
    completed_at: datetime | None
    status: str
    findings: str | None
    recommendations: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class InspectionCreate(BaseModel):
    mine_id: uuid.UUID
    inspection_type: str = "routine"
    scheduled_at: datetime
    inspector_id: uuid.UUID
