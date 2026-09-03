import uuid
from datetime import datetime
from pydantic import BaseModel


class ViolationOut(BaseModel):
    id: uuid.UUID
    mine_id: uuid.UUID
    inspection_id: uuid.UUID | None
    category: str
    severity: str
    description: str
    regulation_ref: str | None
    status: str
    due_date: datetime | None
    resolved_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ViolationCreate(BaseModel):
    mine_id: uuid.UUID
    inspection_id: uuid.UUID | None = None
    category: str
    severity: str = "medium"
    description: str
    regulation_ref: str | None = None
    due_date: datetime | None = None
    reported_by: uuid.UUID
