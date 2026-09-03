import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ComplianceRecord(Base):
    __tablename__ = "compliance_records"
    __table_args__ = {"schema": "compliance"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mine_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    overall_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0)
    safety_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0)
    environmental_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0)
    labour_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending|compliant|non_compliant
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class ComplianceCategory(Base):
    __tablename__ = "compliance_categories"
    __table_args__ = {"schema": "compliance"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    weight: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=1.0)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
