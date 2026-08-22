from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import date, datetime
from app.models.employee import EmploymentStatus
from app.schemas.user import UserResponse


class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    manager_id: Optional[int] = None
    location: Optional[str] = None
    date_of_joining: date
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    nationality: Optional[str] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    personal_email: Optional[EmailStr] = None
    bank_account_number: Optional[str] = None
    bank_name: Optional[str] = None
    ifsc_code: Optional[str] = None
    pan_number: Optional[str] = None
    uan_number: Optional[str] = None
    employee_code: Optional[str] = None
    about: Optional[str] = None
    interests: Optional[str] = None
    skills: Optional[str] = None
    certifications: Optional[str] = None


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    manager_id: Optional[int] = None
    location: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    nationality: Optional[str] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    personal_email: Optional[EmailStr] = None
    bank_account_number: Optional[str] = None
    bank_name: Optional[str] = None
    ifsc_code: Optional[str] = None
    pan_number: Optional[str] = None
    uan_number: Optional[str] = None
    employee_code: Optional[str] = None
    about: Optional[str] = None
    interests: Optional[str] = None
    skills: Optional[str] = None
    certifications: Optional[str] = None
    status: Optional[EmploymentStatus] = None


class EmployeeResponse(EmployeeBase):
    id: int
    user_id: Optional[int] = None
    login_id: Optional[str] = None
    avatar_url: Optional[str] = None
    status: EmploymentStatus
    full_name: str
    initials: str
    created_at: datetime
    updated_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class EmployeeCardResponse(BaseModel):
    id: int
    full_name: str
    initials: str
    avatar_url: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    login_id: str
    status: str  # present, absent, on_leave

    class Config:
        from_attributes = True


class EmployeeProfileResponse(EmployeeResponse):
    manager: Optional["EmployeeResponse"] = None
    subordinates_count: int = 0
    attendance_today: Optional["AttendanceResponse"] = None
    time_off_balances: List["TimeOffAllocationResponse"] = []

    class Config:
        from_attributes = True


# Forward references
from app.schemas.attendance import AttendanceResponse
from app.schemas.time_off import TimeOffAllocationResponse
EmployeeProfileResponse.model_rebuild()