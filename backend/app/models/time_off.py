from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class TimeOffTypeEnum(str, enum.Enum):
    PAID_TIME_OFF = "paid_time_off"
    SICK_LEAVE = "sick_leave"
    UNPAID_LEAVE = "unpaid_leave"


class TimeOffRequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class TimeOffType(Base):
    __tablename__ = "time_off_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    is_paid = Column(Boolean, default=True, nullable=False)
    color = Column(String(7), default="#3B82F6")  # hex color
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<TimeOffType(id={self.id}, name='{self.name}')>"


class TimeOffRequest(Base):
    __tablename__ = "time_off_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    time_off_type_id = Column(Integer, ForeignKey("time_off_types.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_days = Column(Integer, nullable=False)
    reason = Column(Text)
    status = Column(SQLEnum(TimeOffRequestStatus), default=TimeOffRequestStatus.PENDING, nullable=False)
    approved_by_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True))
    rejection_reason = Column(Text)
    attachment_url = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    employee = relationship("Employee", foreign_keys=[employee_id], back_populates="time_off_requests")
    approver = relationship("Employee", foreign_keys=[approved_by_id])
    time_off_type = relationship("TimeOffType")

    def __repr__(self):
        return f"<TimeOffRequest(id={self.id}, employee_id={self.employee_id}, status='{self.status}')>"


class TimeOffAllocation(Base):
    __tablename__ = "time_off_allocations"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    time_off_type_id = Column(Integer, ForeignKey("time_off_types.id"), nullable=False)
    year = Column(Integer, nullable=False)
    allocated_days = Column(Integer, default=0, nullable=False)
    used_days = Column(Integer, default=0, nullable=False)
    carry_over_days = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    employee = relationship("Employee", back_populates="time_off_allocations")
    time_off_type = relationship("TimeOffType")

    @property
    def available_days(self):
        return self.allocated_days + self.carry_over_days - self.used_days

    def __repr__(self):
        return f"<TimeOffAllocation(id={self.id}, employee_id={self.employee_id}, type_id={self.time_off_type_id}, available={self.available_days})>"