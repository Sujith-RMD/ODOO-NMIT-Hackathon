from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.services.auth import AuthService
from app.services.notification import NotificationService
from app.schemas.notification import NotificationResponse, NotificationMarkRead, UnreadCountResponse
from app.models.user import User
from app.models.employee import Employee
from app.schemas.common import PaginatedResponse


router = APIRouter(prefix="/notifications", tags=["Notifications"])


def get_notification_service(db: Session = Depends(get_db)) -> NotificationService:
    return NotificationService(db)


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


from app.services.auth import oauth2_scheme

def get_current_user(token: str = Depends(oauth2_scheme), auth_service: AuthService = Depends(get_auth_service)) -> User:
    return auth_service.get_current_user(token)


@router.get("", response_model=PaginatedResponse[NotificationResponse])
def get_notifications(
    unread_only: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    notification_service: NotificationService = Depends(get_notification_service),
    current_user: User = Depends(get_current_user)
):
    employee = notification_service.db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee record not found")

    notifications, total = notification_service.get_notifications(
        employee.id, unread_only, page, page_size
    )
    return PaginatedResponse(
        items=[NotificationResponse.model_validate(n) for n in notifications],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    notification_service: NotificationService = Depends(get_notification_service),
    current_user: User = Depends(get_current_user)
):
    employee = notification_service.db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee record not found")

    count = notification_service.get_unread_count(employee.id)
    return UnreadCountResponse(unread_count=count)


@router.post("/mark-read")
def mark_as_read(
    data: NotificationMarkRead,
    notification_service: NotificationService = Depends(get_notification_service),
    current_user: User = Depends(get_current_user)
):
    employee = notification_service.db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee record not found")

    count = notification_service.mark_as_read(employee.id, data.notification_ids)
    return {"message": f"Marked {count} notifications as read"}


@router.post("/mark-all-read")
def mark_all_as_read(
    notification_service: NotificationService = Depends(get_notification_service),
    current_user: User = Depends(get_current_user)
):
    employee = notification_service.db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee record not found")

    count = notification_service.mark_all_as_read(employee.id)
    return {"message": f"Marked {count} notifications as read"}