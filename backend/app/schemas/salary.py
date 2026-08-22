from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from app.models.salary import CalculationBasis, ComponentType
from app.schemas.common import PaginatedResponse


class SalaryComponentBase(BaseModel):
    name: str
    component_type: ComponentType
    calculation_basis: CalculationBasis
    percentage: Decimal = Decimal("0")
    fixed_amount: Decimal = Decimal("0")
    display_order: int = 0
    is_active: bool = True


class SalaryComponentCreate(SalaryComponentBase):
    pass


class SalaryComponentUpdate(BaseModel):
    name: Optional[str] = None
    component_type: Optional[ComponentType] = None
    calculation_basis: Optional[CalculationBasis] = None
    percentage: Optional[Decimal] = None
    fixed_amount: Optional[Decimal] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class SalaryComponentResponse(SalaryComponentBase):
    id: int
    salary_structure_id: int
    monthly_amount: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SalaryStructureBase(BaseModel):
    employee_id: int
    wage_type: str = "monthly"
    monthly_wage: Decimal = Decimal("0")
    yearly_wage: Decimal = Decimal("0")
    effective_from: date
    working_days_per_month: int = 26
    break_time_minutes: int = 60
    is_active: bool = True


class SalaryStructureCreate(BaseModel):
    employee_id: int
    wage_type: str = "monthly"
    monthly_wage: Decimal = Decimal("0")
    effective_from: date
    working_days_per_month: int = 26
    break_time_minutes: int = 60
    components: List[SalaryComponentCreate] = []


class SalaryStructureUpdate(BaseModel):
    wage_type: Optional[str] = None
    monthly_wage: Optional[Decimal] = None
    yearly_wage: Optional[Decimal] = None
    effective_from: Optional[date] = None
    working_days_per_month: Optional[int] = None
    break_time_minutes: Optional[int] = None
    is_active: Optional[bool] = None
    components: Optional[List[SalaryComponentCreate]] = None


class SalaryStructureResponse(SalaryStructureBase):
    id: int
    created_at: datetime
    updated_at: datetime
    components: List[SalaryComponentResponse] = []

    class Config:
        from_attributes = True


class SalaryCalculationResult(BaseModel):
    monthly_wage: Decimal
    yearly_wage: Decimal
    components: List[SalaryComponentResponse]
    total_earnings: Decimal
    total_deductions: Decimal
    net_salary: Decimal
    pf_employee: Decimal
    pf_employer: Decimal
    professional_tax: Decimal
    working_days: int
    present_days: int
    paid_leave_days: int
    unpaid_leave_days: int
    payable_days: int


class PayableDaysSummary(BaseModel):
    total_working_days: int
    present_days: int
    paid_leave_days: int
    unpaid_leave_days: int
    payable_days: int