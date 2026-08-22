from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from app.database import get_db
from app.services.auth import AuthService
from app.services.employee import EmployeeService
from app.schemas.employee import EmployeeUpdate, EmployeeResponse
from app.schemas.auth import ChangePasswordRequest, ChangePasswordResponse
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.schemas.common import MessageResponse
from fastapi import UploadFile, File, Form


router = APIRouter(prefix="/profile", tags=["Profile"])


def get_employee_service(db: Session = Depends(get_db)) -> EmployeeService:
    return EmployeeService(db)


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


def get_current_user(token: str = Depends(AuthService.oauth2_scheme), auth_service: AuthService = Depends(get_auth_service)) -> User:
    return auth_service.get_current_user(token)


@router.get("", response_model=EmployeeResponse)
def get_my_profile(
    employee_service: EmployeeService = Depends(get_employee_service),
    current_user: User = Depends(get_current_user)
):
    employee = employee_service.get_employee_by_user_id(current_user.id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee record not found")
    return EmployeeResponse.model_validate(employee)


@router.put("", response_model=EmployeeResponse)
def update_my_profile(
    update_data: EmployeeUpdate,
    employee_service: EmployeeService = Depends(get_employee_service),
    current_user: User = Depends(get_current_user)
):
    employee = employee_service.get_employee_by_user_id(current_user.id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee record not found")

    # Employees can only update certain fields
    allowed_fields = {"about", "interests", "skills", "certifications", "address", "personal_email", "phone", "bank_account_number", "bank_name", "ifsc_code", "pan_number", "uan_number"}
    update_dict = update_data.model_dump(exclude_unset=True)
    for key in list(update_dict.keys()):
        if key not in allowed_fields:
            del update_dict[key]
    update_data = EmployeeUpdate(**update_dict)

    updated = employee_service.update_employee(employee.id, update_data)
    return EmployeeResponse.model_validate(updated)


@router.post("/change-password", response_model=ChangePasswordResponse)
def change_password(
    change_data: ChangePasswordRequest,
    auth_service: AuthService = Depends(get_auth_service),
    current_user: User = Depends(get_current_user)
):
    return auth_service.change_password(current_user, change_data)


@router.post("/avatar", response_model=MessageResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    employee_service: EmployeeService = Depends(get_employee_service),
    current_user: User = Depends(get_current_user)
):
    employee = employee_service.get_employee_by_user_id(current_user.id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee record not found")

    # In a real implementation, upload to cloud storage (S3, etc.)
    # For now, we'll just store a placeholder URL
    # avatar_url = upload_to_storage(file)
    avatar_url = f"/uploads/avatars/{employee.id}_{file.filename}"

    employee.avatar_url = avatar_url
    employee_service.db.commit()

    return MessageResponse(message="Avatar updated successfully")