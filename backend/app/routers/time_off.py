from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from app.database import get_db
from app.services.auth import AuthService
from app.services.time_off import TimeOffService
from app.services.notification import NotificationService
from app.schemas.time_off import (
    TimeOffTypeCreate, TimeOffTypeResponse,
    TimeOffRequestCreate, TimeOffRequestResponse, TimeOffRequestAdminAction,
    TimeOffAllocationCreate, TimeOffAllocationUpdate, TimeOffAllocationResponse,
    TimeOffBalanceResponse
)
from app.models.user import User, UserRole
from app.models.time_off import TimeOffRequestStatus
from app.models.employee import Employee


router = APIRouter(prefix="/time-off", tags=["Time Off"])


def get_time_off_service(db: Session = Depends(get_db)) -> TimeOffService:
    return TimeOffService(db)


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


def get_current_user(token: str = Depends(AuthService.oauth2_scheme), auth_service: AuthService = Depends(get_auth_service)) -> User:
    return auth_service.get_current_user(token)


# Time Off Types (Admin only)
@router.get("/types", response_model=List[TimeOffTypeResponse])
def get_time_off_types(
    time_off_service: TimeOffService = Depends(get_time_off_service),
    current_user: User = Depends(get_current_user)
):
    return time_off_service.get_time_off_types()


@router.post("/types", response_model=TimeOffTypeResponse, status_code=status.HTTP_201_CREATED)
def create_time_off_type(
    data: TimeOffTypeCreate,
    time_off_service: TimeOffService = Depends(get_time_off_service),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return time_off_service.create_time_off_type(data)


# Employee Time Off Requests
@router.get("/my-requests", response_model=List[TimeOffRequestResponse])
def get_my_requests(
    status_filter: Optional[TimeOffRequestStatus] = Query(None, alias="status"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    time_off_service: TimeOffService = Depends(get_time_off_service),
    current_user: User = Depends(get_current_user)
):
    employee = time_off_service.db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee record not found")

    requests = time_off_service.get_employee_requests(
        employee.id, status_filter, start_date, end_date
    )
    return [TimeOffRequestResponse.model_validate(r) for r in requests]


@router.get("/my-balances", response_model=List[TimeOffBalanceResponse])
def get_my_balances(
    year: Optional[int] = Query(None),
    time_off_service: TimeOffService = Depends(get_time_off_service),
    current_user: User = Depends(get_current_user)
):
    employee = time_off_service.db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee record not found")

    return time_off_service.get_balances(employee.id, year)


@router.post("/my-requests", response_model=TimeOffRequestResponse, status_code=status.HTTP_201_CREATED)
def create_time_off_request(
    data: TimeOffRequestCreate,
    time_off_service: TimeOffService = Depends(get_time_off_service),
    current_user: User = Depends(get_current_user)
):
    employee = time_off_service.db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee record not found")

    try:
        request = time_off_service.create_request(employee.id, data)
        return TimeOffRequestResponse.model_validate(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/my-requests/{request_id}", response_model=TimeOffRequestResponse)
def update_my_request(
    request_id: int,
    data: TimeOffRequestCreate,
    time_off_service: TimeOffService = Depends(get_time_off_service),
    current_user: User = Depends(get_current_user)
):
    employee = time_off_service.db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee record not found")

    request = time_off_service.get_time_off_request(request_id)
    if not request or request.employee_id != employee.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    if request.status != TimeOffRequestStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot update non-pending request")

    try:
        updated = time_off_service.update_request(request_id, data)
        return TimeOffRequestResponse.model_validate(updated)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/my-requests/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_my_request(
    request_id: int,
    time_off_service: TimeOffService = Depends(get_time_off_service),
    current_user: User = Depends(get_current_user)
):
    employee = time_off_service.db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee record not found")

    result = time_off_service.cancel_request(request_id, employee.id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found or cannot be cancelled")


# Admin Time Off Routes
@router.get("/admin/requests", response_model=List[TimeOffRequestResponse])
def get_all_requests(
    status_filter: Optional[TimeOffRequestStatus] = Query(None, alias="status"),
    employee_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    time_off_service: TimeOffService = Depends(get_time_off_service),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    requests, _ = time_off_service.get_all_requests(
        status_filter, employee_id, start_date, end_date, page, page_size
    )
    return [TimeOffRequestResponse.model_validate(r) for r in requests]


@router.get("/admin/requests/{request_id}", response_model=TimeOffRequestResponse)
def get_request_detail(
    request_id: int,
    time_off_service: TimeOffService = Depends(get_time_off_service),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    request = time_off_service.get_time_off_request(request_id)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return TimeOffRequestResponse.model_validate(request)


@router.post("/admin/requests/{request_id}/approve", response_model=TimeOffRequestResponse)
def approve_request(
    request_id: int,
    time_off_service: TimeOffService = Depends(get_time_off_service),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    admin_employee = time_off_service.db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not admin_employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin employee record not found")

    request = time_off_service.approve_request(request_id, admin_employee.id)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found or not pending")

    # Create notification
    notification_service = NotificationService(time_off_service.db)
    notification_service.notify_time_off_approved(
        request.employee_id, request_id, admin_employee.full_name
    )

    return TimeOffRequestResponse.model_validate(request)


@router.post("/admin/requests/{request_id}/reject", response_model=TimeOffRequestResponse)
def reject_request(
    request_id: int,
    rejection_reason: str = Query(...),
    time_off_service: TimeOffService = Depends(get_time_off_service),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    admin_employee = time_off_service.db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not admin_employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin employee record not found")

    request = time_off_service.reject_request(request_id, admin_employee.id, rejection_reason)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found or not pending")

    # Create notification
    notification_service = NotificationService(time_off_service.db)
    notification_service.notify_time_off_rejected(
        request.employee_id, request_id, admin_employee.full_name, rejection_reason
    )

    return TimeOffRequestResponse.model_validate(request)


# Allocations (Admin)
@router.get("/admin/allocations", response_model=List[TimeOffAllocationResponse])
def get_all_allocations(
    employee_id: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    time_off_service: TimeOffService = Depends(get_time_off_service),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    if employee_id:
        return time_off_service.get_employee_allocations(employee_id, year)
    return []


@router.post("/admin/allocations", response_model=TimeOffAllocationResponse, status_code=status.HTTP_201_CREATED)
def create_allocation(
    data: TimeOffAllocationCreate,
    time_off_service: TimeOffService = Depends(get_time_off_service),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return TimeOffAllocationResponse.model_validate(time_off_service.create_allocation(data))


@router.put("/admin/allocations/{allocation_id}", response_model=TimeOffAllocationResponse)
def update_allocation(
    allocation_id: int,
    data: TimeOffAllocationUpdate,
    time_off_service: TimeOffService = Depends(get_time_off_service),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    allocation = time_off_service.update_allocation(allocation_id, data)
    if not allocation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Allocation not found")
    return TimeOffAllocationResponse.model_validate(allocation)