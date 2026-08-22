from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class NotificationType(str, enum.Enum):
    TIME_OFF_REQUEST = "time_off_request"
    TIME_OFF_APPROVED = "time_off_approved"
    TIME_OFF_REJECTED = "time_off_rejected"
    ATTENDANCE_REMINDER = "attendance_reminder"
    EMPLOYEE_CREATED = "employee_created"
    HR_UPDATE = "hr_update"
    SALARY_UPDATED = "salary_updated"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    type = Column(SQLEnum(NotificationType), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text)
    is_read = Column(Boolean, default=False, nullable=False)
    reference_id = Column(Integer)  # ID of related entity (time_off_request, etc.)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    employee = relationship("Employee", back_populates="notifications")

    def __repr__(self):
        return f"<Notification(id={self.id}, employee_id={self.employee_id}, type='{self.type}', read={self.is_read})>"