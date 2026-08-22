from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.services.auth import AuthService
from app.services.employee import EmployeeService
from app.services.attendance import AttendanceService
from app.services.time_off import TimeOffService
from app.schemas.employee import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse, EmployeeCardResponse,
    EmployeeProfileResponse
)
from app.schemas.auth import UserResponse
from app.schemas.common import PaginatedResponse
from app.models.user import User, UserRole
from app.models.employee import EmploymentStatus
from datetime import date


router = APIRouter(prefix="/employees", tags=["Employees"])


def get_employee_service(db: Session = Depends(get_db)) -> EmployeeService:
    return EmployeeService(db)


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


from app.services.auth import oauth2_scheme

def get_current_user(token: str = Depends(oauth2_scheme), auth_service: AuthService = Depends(get_auth_service)) -> User:
    return auth_service.get_current_user(token)


def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


@router.get("", response_model=PaginatedResponse[EmployeeCardResponse])
def list_employees(
    search: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    status: Optional[EmploymentStatus] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    employee_service: EmployeeService = Depends(get_employee_service),
    current_user: User = Depends(get_current_user)
):
    employees, total = employee_service.get_all_employees(
        search=search,
        department=department,
        status=status,
        page=page,
        page_size=page_size
    )
    cards = [employee_service.get_employee_card_data(e) for e in employees]
    return PaginatedResponse(
        items=cards,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.get("/departments", response_model=List[str])
def get_departments(
    employee_service: EmployeeService = Depends(get_employee_service),
    current_user: User = Depends(get_current_user)
):
    return employee_service.get_departments()


@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    employee_data: EmployeeCreate,
    password: str = Query(..., description="Initial password for the employee"),
    employee_service: EmployeeService = Depends(get_employee_service),
    auth_service: AuthService = Depends(get_auth_service),
    current_user: User = Depends(require_admin)
):
    # Check if email already exists
    existing_user = auth_service.db.query(User).filter(User.email == employee_data.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user, employee = auth_service.create_employee_with_user(employee_data, password)

    # Seed default allocations and salary structure
    time_off_service = TimeOffService(auth_service.db)
    time_off_service.seed_default_allocations(employee.id, employee.date_of_joining.year)

    salary_service = SalaryService(auth_service.db)
    # Default salary will be set by admin later

    return EmployeeResponse.model_validate(employee)


@router.get("/{employee_id}", response_model=EmployeeProfileResponse)
def get_employee(
    employee_id: int,
    employee_service: EmployeeService = Depends(get_employee_service),
    current_user: User = Depends(get_current_user)
):
    # Employees can only view their own profile unless admin
    if current_user.role != UserRole.ADMIN:
        employee = employee_service.get_employee_by_user_id(current_user.id)
        if not employee or employee.id != employee_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    profile_data = employee_service.get_employee_profile(employee_id)
    if not profile_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    employee = profile_data["employee"]
    response = EmployeeProfileResponse.model_validate(employee)
    response.manager = EmployeeResponse.model_validate(profile_data["employee"].manager) if profile_data["employee"].manager else None
    response.subordinates_count = profile_data["subordinates_count"]
    response.attendance_today = profile_data["attendance_today"]
    response.time_off_balances = profile_data["time_off_balances"]

    return response


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    update_data: EmployeeUpdate,
    employee_service: EmployeeService = Depends(get_employee_service),
    current_user: User = Depends(get_current_user)
):
    # Check permissions
    if current_user.role != UserRole.ADMIN:
        employee = employee_service.get_employee_by_user_id(current_user.id)
        if not employee or employee.id != employee_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        # Employees can only update certain fields
        allowed_fields = {"about", "interests", "skills", "certifications", "address", "personal_email", "phone"}
        update_dict = update_data.model_dump(exclude_unset=True)
        for key in list(update_dict.keys()):
            if key not in allowed_fields:
                del update_dict[key]
        update_data = EmployeeUpdate(**update_dict)

    employee = employee_service.update_employee(employee_id, update_data)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return EmployeeResponse.model_validate(employee)


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: int,
    employee_service: EmployeeService = Depends(get_employee_service),
    current_user: User = Depends(require_admin)
):
    if not employee_service.delete_employee(employee_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")