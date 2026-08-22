from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime
from app.models.time_off import TimeOffTypeEnum, TimeOffRequestStatus
from app.schemas.common import PaginatedResponse


class TimeOffTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_paid: bool = True
    color: str = "#3B82F6"


class TimeOffTypeCreate(TimeOffTypeBase):
    pass


class TimeOffTypeResponse(TimeOffTypeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class TimeOffRequestBase(BaseModel):
    employee_id: int
    time_off_type_id: int
    start_date: date
    end_date: date
    reason: Optional[str] = None
    attachment_url: Optional[str] = None

    @field_validator("end_date")
    @classmethod
    def end_after_start(cls, v, info):
        if "start_date" in info.data and v < info.data["start_date"]:
            raise ValueError("End date must be after or equal to start date")
        return v


class TimeOffRequestCreate(BaseModel):
    time_off_type_id: int
    start_date: date
    end_date: date
    reason: Optional[str] = None
    attachment_url: Optional[str] = None

    @field_validator("end_date")
    @classmethod
    def end_after_start(cls, v, info):
        if "start_date" in info.data and v < info.data["start_date"]:
            raise ValueError("End date must be after or equal to start date")
        return v


class TimeOffRequestUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    reason: Optional[str] = None
    attachment_url: Optional[str] = None


class TimeOffRequestAdminAction(BaseModel):
    status: TimeOffRequestStatus
    rejection_reason: Optional[str] = None


class TimeOffRequestResponse(TimeOffRequestBase):
    id: int
    total_days: int
    status: TimeOffRequestStatus
    approved_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    employee: Optional["EmployeeResponse"] = None
    approver: Optional["EmployeeResponse"] = None
    time_off_type: Optional[TimeOffTypeResponse] = None

    class Config:
        from_attributes = True


class TimeOffAllocationBase(BaseModel):
    employee_id: int
    time_off_type_id: int
    year: int
    allocated_days: int = 0
    carry_over_days: int = 0


class TimeOffAllocationCreate(TimeOffAllocationBase):
    pass


class TimeOffAllocationUpdate(BaseModel):
    allocated_days: Optional[int] = None
    used_days: Optional[int] = None
    carry_over_days: Optional[int] = None


class TimeOffAllocationResponse(TimeOffAllocationBase):
    id: int
    used_days: int
    available_days: int
    created_at: datetime
    updated_at: datetime
    time_off_type: Optional[TimeOffTypeResponse] = None

    class Config:
        from_attributes = True


class TimeOffBalanceResponse(BaseModel):
    time_off_type: TimeOffTypeResponse
    allocated_days: int
    used_days: int
    carry_over_days: int
    available_days: int


# Forward reference
from app.schemas.employee import EmployeeResponse
TimeOffRequestResponse.model_rebuild()