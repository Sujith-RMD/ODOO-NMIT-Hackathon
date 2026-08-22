from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date, time
from app.database import get_db
from app.services.auth import AuthService
from app.services.attendance import AttendanceService
from app.models.employee import Employee
from app.schemas.attendance import (
    AttendanceCreate, AttendanceUpdate, AttendanceResponse,
    AdminAttendanceFilter, AttendanceSummary, CheckInResponse, CheckOutResponse
)
from app.models.user import User, UserRole


router = APIRouter(prefix="/attendance", tags=["Attendance"])


def get_attendance_service(db: Session = Depends(get_db)) -> AttendanceService:
    return AttendanceService(db)


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


from app.services.auth import oauth2_scheme

def get_current_user(token: str = Depends(oauth2_scheme), auth_service: AuthService = Depends(get_auth_service)) -> User:
    return auth_service.get_current_user(token)


@router.post("/check-in", response_model=CheckInResponse)
def check_in(
    check_in_time: time = Query(...),
    notes: Optional[str] = Query(None),
    attendance_service: AttendanceService = Depends(get_attendance_service),
    current_user: User = Depends(get_current_user)
):
    employee = attendance_service.db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee record not found")

    today = date.today()
    attendance = attendance_service.check_in(employee.id, today, check_in_time, notes)
    return CheckInResponse(
        attendance=AttendanceResponse.model_validate(attendance),
        message="Successfully checked in"
    )


@router.post("/check-out", response_model=CheckOutResponse)
def check_out(
    check_out_time: time = Query(...),
    notes: Optional[str] = Query(None),
    attendance_service: AttendanceService = Depends(get_attendance_service),
    current_user: User = Depends(get_current_user)
):
    employee = attendance_service.db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee record not found")

    today = date.today()
    attendance = attendance_service.check_out(employee.id, today, check_out_time, notes)
    return CheckOutResponse(
        attendance=AttendanceResponse.model_validate(attendance),
        message="Successfully checked out",
        work_hours=attendance.work_hours,
        extra_hours=attendance.extra_hours
    )


@router.get("/today", response_model=AttendanceResponse)
def get_today_attendance(
    attendance_service: AttendanceService = Depends(get_attendance_service),
    current_user: User = Depends(get_current_user)
):
    employee = attendance_service.db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee record not found")

    attendance = attendance_service.get_attendance(employee.id, date.today())
    if not attendance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No attendance record for today")
    return AttendanceResponse.model_validate(attendance)


@router.get("/my-history", response_model=List[AttendanceResponse])
def get_my_attendance(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    attendance_service: AttendanceService = Depends(get_attendance_service),
    current_user: User = Depends(get_current_user)
):
    employee = attendance_service.db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee record not found")

    if not start_date:
        start_date = date.today().replace(day=1)
    if not end_date:
        end_date = date.today()

    attendances = attendance_service.get_employee_attendance(employee.id, start_date, end_date)
    return [AttendanceResponse.model_validate(a) for a in attendances]


@router.get("/my-summary", response_model=AttendanceSummary)
def get_my_attendance_summary(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    attendance_service: AttendanceService = Depends(get_attendance_service),
    current_user: User = Depends(get_current_user)
):
    employee = attendance_service.db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee record not found")

    if not start_date:
        start_date = date.today().replace(day=1)
    if not end_date:
        end_date = date.today()

    return attendance_service.get_attendance_summary(employee.id, start_date, end_date)


@router.get("/status", response_model=str)
def get_my_status(
    attendance_service: AttendanceService = Depends(get_attendance_service),
    current_user: User = Depends(get_current_user)
):
    employee = attendance_service.db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee record not found")
    return attendance_service.get_today_status(employee.id)


# Admin routes
@router.get("/admin/all", response_model=List[AttendanceResponse])
def get_all_attendance(
    filters: AdminAttendanceFilter = Depends(),
    attendance_service: AttendanceService = Depends(get_attendance_service),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    attendances, _ = attendance_service.get_admin_attendance(filters)
    return [AttendanceResponse.model_validate(a) for a in attendances]


@router.put("/admin/{attendance_id}", response_model=AttendanceResponse)
def update_attendance_admin(
    attendance_id: int,
    update_data: AttendanceUpdate,
    attendance_service: AttendanceService = Depends(get_attendance_service),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    attendance = attendance_service.update_attendance(attendance_id, update_data)
    if not attendance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")
    return AttendanceResponse.model_validate(attendance)