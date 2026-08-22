from sqlalchemy import Column, Integer, DateTime, Date, Time, ForeignKey, Enum as SQLEnum, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    HALF_DAY = "half_day"
    ON_LEAVE = "on_leave"


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    check_in = Column(Time)
    check_out = Column(Time)
    work_hours = Column(Integer, default=0)  # in minutes
    extra_hours = Column(Integer, default=0)  # in minutes
    status = Column(SQLEnum(AttendanceStatus), default=AttendanceStatus.ABSENT, nullable=False)
    notes = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    employee = relationship("Employee", back_populates="attendances")

    def __repr__(self):
        return f"<Attendance(id={self.id}, employee_id={self.employee_id}, date='{self.date}', status='{self.status}')>"