from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class EmploymentStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ON_LEAVE = "on_leave"
    TERMINATED = "terminated"


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), nullable=False)
    phone = Column(String(20))
    department = Column(String(100))
    position = Column(String(100))
    manager_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    location = Column(String(100))
    date_of_joining = Column(Date, nullable=False)
    date_of_birth = Column(Date)
    address = Column(Text)
    nationality = Column(String(50))
    gender = Column(String(20))
    marital_status = Column(String(20))
    personal_email = Column(String(100))
    bank_account_number = Column(String(50))
    bank_name = Column(String(100))
    ifsc_code = Column(String(20))
    pan_number = Column(String(20))
    uan_number = Column(String(20))
    employee_code = Column(String(50))
    avatar_url = Column(String(255))
    status = Column(SQLEnum(EmploymentStatus), default=EmploymentStatus.ACTIVE, nullable=False)
    about = Column(Text)
    interests = Column(Text)
    skills = Column(Text)
    certifications = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="employee")
    manager = relationship("Employee", remote_side=[id], backref="subordinates")
    attendances = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")
    time_off_requests = relationship("TimeOffRequest", foreign_keys="TimeOffRequest.employee_id", back_populates="employee", cascade="all, delete-orphan")
    time_off_allocations = relationship("TimeOffAllocation", back_populates="employee", cascade="all, delete-orphan")
    salary_structure = relationship("SalaryStructure", back_populates="employee", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="employee", cascade="all, delete-orphan")
    documents = relationship("Document", foreign_keys="Document.employee_id", back_populates="employee", cascade="all, delete-orphan")

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def initials(self):
        return f"{self.first_name[0]}{self.last_name[0]}".upper()

    def __repr__(self):
        return f"<Employee(id={self.id}, name='{self.full_name}', department='{self.department}')>"