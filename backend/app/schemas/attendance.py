from pydantic import BaseModel
from typing import Optional, List
from datetime import date, time, datetime
from app.models.attendance import AttendanceStatus
from app.schemas.common import PaginatedResponse


class AttendanceBase(BaseModel):
    employee_id: int
    date: date
    check_in: Optional[time] = None
    check_out: Optional[time] = None
    work_hours: int = 0
    extra_hours: int = 0
    status: AttendanceStatus = AttendanceStatus.ABSENT
    notes: Optional[str] = None


class AttendanceCreate(BaseModel):
    date: date
    check_in: Optional[time] = None
    check_out: Optional[time] = None
    notes: Optional[str] = None


class AttendanceUpdate(BaseModel):
    check_in: Optional[time] = None
    check_out: Optional[time] = None
    notes: Optional[str] = None


class AttendanceResponse(AttendanceBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AttendanceSummary(BaseModel):
    total_working_days: int
    present_days: int
    absent_days: int
    late_days: int
    half_days: int
    on_leave_days: int
    total_work_hours: int
    total_extra_hours: int


class CheckInResponse(BaseModel):
    attendance: AttendanceResponse
    message: str


class CheckOutResponse(BaseModel):
    attendance: AttendanceResponse
    message: str
    work_hours: int
    extra_hours: int


class AdminAttendanceFilter(BaseModel):
    employee_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[AttendanceStatus] = None
    page: int = 1
    page_size: int = 20