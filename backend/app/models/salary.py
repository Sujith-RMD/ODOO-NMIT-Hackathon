from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Enum as SQLEnum, Date, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class CalculationBasis(str, enum.Enum):
    WAGE = "wage"
    BASIC = "basic"
    FIXED = "fixed"


class ComponentType(str, enum.Enum):
    EARNING = "earning"
    DEDUCTION = "deduction"


class SalaryStructure(Base):
    __tablename__ = "salary_structures"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), unique=True, nullable=False)
    wage_type = Column(String(20), default="monthly")  # monthly, yearly
    monthly_wage = Column(Numeric(12, 2), default=0)
    yearly_wage = Column(Numeric(12, 2), default=0)
    effective_from = Column(Date, nullable=False)
    working_days_per_month = Column(Integer, default=26)
    break_time_minutes = Column(Integer, default=60)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    employee = relationship("Employee", back_populates="salary_structure")
    components = relationship("SalaryComponent", back_populates="salary_structure", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<SalaryStructure(id={self.id}, employee_id={self.employee_id}, monthly_wage={self.monthly_wage})>"


class SalaryComponent(Base):
    __tablename__ = "salary_components"

    id = Column(Integer, primary_key=True, index=True)
    salary_structure_id = Column(Integer, ForeignKey("salary_structures.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    component_type = Column(SQLEnum(ComponentType), nullable=False)
    calculation_basis = Column(SQLEnum(CalculationBasis), nullable=False)
    percentage = Column(Numeric(5, 2), default=0)  # e.g., 50.00 for 50%
    fixed_amount = Column(Numeric(12, 2), default=0)
    monthly_amount = Column(Numeric(12, 2), default=0)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    salary_structure = relationship("SalaryStructure", back_populates="components")

    def __repr__(self):
        return f"<SalaryComponent(id={self.id}, name='{self.name}', basis='{self.calculation_basis}', amount={self.monthly_amount})>"