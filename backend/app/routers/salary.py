from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from decimal import Decimal
from app.database import get_db
from app.services.auth import AuthService
from app.services.salary import SalaryService
from app.services.notification import NotificationService
from app.schemas.salary import (
    SalaryStructureCreate, SalaryStructureUpdate, SalaryStructureResponse,
    SalaryCalculationResult, PayableDaysSummary
)
from app.models.user import User, UserRole
from app.models.employee import Employee


router = APIRouter(prefix="/salary", tags=["Salary"])


def get_salary_service(db: Session = Depends(get_db)) -> SalaryService:
    return SalaryService(db)


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


def get_current_user(token: str = Depends(AuthService.oauth2_scheme), auth_service: AuthService = Depends(get_auth_service)) -> User:
    return auth_service.get_current_user(token)


# Employee salary view (limited)
@router.get("/my-salary", response_model=SalaryCalculationResult)
def get_my_salary(
    calculation_date: Optional[date] = Query(None),
    salary_service: SalaryService = Depends(get_salary_service),
    current_user: User = Depends(get_current_user)
):
    employee = salary_service.db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee record not found")

    result = salary_service.calculate_salary(employee.id, calculation_date)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No salary structure found")
    return result


@router.get("/my-payable-days", response_model=PayableDaysSummary)
def get_my_payable_days(
    calculation_date: Optional[date] = Query(None),
    salary_service: SalaryService = Depends(get_salary_service),
    current_user: User = Depends(get_current_user)
):
    employee = salary_service.db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee record not found")

    return salary_service.get_payable_days_summary(employee.id, calculation_date)


# Admin salary management
@router.get("/admin/{employee_id}", response_model=SalaryStructureResponse)
def get_employee_salary_structure(
    employee_id: int,
    salary_service: SalaryService = Depends(get_salary_service),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    structure = salary_service.get_salary_structure(employee_id)
    if not structure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Salary structure not found")
    return SalaryStructureResponse.model_validate(structure)


@router.post("/admin", response_model=SalaryStructureResponse, status_code=status.HTTP_201_CREATED)
def create_salary_structure(
    data: SalaryStructureCreate,
    salary_service: SalaryService = Depends(get_salary_service),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    return SalaryStructureResponse.model_validate(salary_service.create_salary_structure(data))


@router.put("/admin/{structure_id}", response_model=SalaryStructureResponse)
def update_salary_structure(
    structure_id: int,
    data: SalaryStructureUpdate,
    salary_service: SalaryService = Depends(get_salary_service),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    structure = salary_service.update_salary_structure(structure_id, data)
    if not structure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Salary structure not found")

    # Notify employee
    notification_service = NotificationService(salary_service.db)
    notification_service.notify_salary_updated(structure.employee_id)

    return SalaryStructureResponse.model_validate(structure)


@router.get("/admin/{employee_id}/calculation", response_model=SalaryCalculationResult)
def calculate_employee_salary(
    employee_id: int,
    calculation_date: Optional[date] = Query(None),
    salary_service: SalaryService = Depends(get_salary_service),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    result = salary_service.calculate_salary(employee_id, calculation_date)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No salary structure found")
    return result


@router.get("/admin/{employee_id}/payable-days", response_model=PayableDaysSummary)
def get_employee_payable_days(
    employee_id: int,
    calculation_date: Optional[date] = Query(None),
    salary_service: SalaryService = Depends(get_salary_service),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    return salary_service.get_payable_days_summary(employee_id, calculation_date)