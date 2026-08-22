from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.notification import Notification, NotificationType
from app.schemas.notification import NotificationCreate, NotificationMarkRead


class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def create_notification(self, data: NotificationCreate) -> Notification:
        notification = Notification(**data.model_dump())
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def get_notifications(
        self,
        employee_id: int,
        unread_only: bool = False,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Notification], int]:
        query = self.db.query(Notification).filter(Notification.employee_id == employee_id)
        if unread_only:
            query = query.filter(Notification.is_read == False)
        total = query.count()
        notifications = query.order_by(desc(Notification.created_at)).offset(
            (page - 1) * page_size
        ).limit(page_size).all()
        return notifications, total

    def get_unread_count(self, employee_id: int) -> int:
        return self.db.query(Notification).filter(
            Notification.employee_id == employee_id,
            Notification.is_read == False
        ).count()

    def mark_as_read(self, employee_id: int, notification_ids: List[int]) -> int:
        count = self.db.query(Notification).filter(
            Notification.employee_id == employee_id,
            Notification.id.in_(notification_ids)
        ).update({Notification.is_read: True})
        self.db.commit()
        return count

    def mark_all_as_read(self, employee_id: int) -> int:
        count = self.db.query(Notification).filter(
            Notification.employee_id == employee_id,
            Notification.is_read == False
        ).update({Notification.is_read: True})
        self.db.commit()
        return count

    # Convenience methods for common notifications
    def notify_time_off_request(self, employee_id: int, request_id: int, requester_name: str):
        self.create_notification(NotificationCreate(
            employee_id=employee_id,
            type=NotificationType.TIME_OFF_REQUEST,
            title="New Time Off Request",
            message=f"{requester_name} has submitted a time off request",
            reference_id=request_id
        ))

    def notify_time_off_approved(self, employee_id: int, request_id: int, approver_name: str):
        self.create_notification(NotificationCreate(
            employee_id=employee_id,
            type=NotificationType.TIME_OFF_APPROVED,
            title="Time Off Approved",
            message=f"Your time off request has been approved by {approver_name}",
            reference_id=request_id
        ))

    def notify_time_off_rejected(self, employee_id: int, request_id: int, approver_name: str, reason: str):
        self.create_notification(NotificationCreate(
            employee_id=employee_id,
            type=NotificationType.TIME_OFF_REJECTED,
            title="Time Off Rejected",
            message=f"Your time off request was rejected by {approver_name}. Reason: {reason}",
            reference_id=request_id
        ))

    def notify_attendance_reminder(self, employee_id: int):
        self.create_notification(NotificationCreate(
            employee_id=employee_id,
            type=NotificationType.ATTENDANCE_REMINDER,
            title="Attendance Reminder",
            message="Don't forget to check in for today"
        ))

    def notify_employee_created(self, employee_id: int, admin_name: str):
        self.create_notification(NotificationCreate(
            employee_id=employee_id,
            type=NotificationType.EMPLOYEE_CREATED,
            title="Welcome to DAYFLOW",
            message=f"Your account has been created by {admin_name}. You can now log in."
        ))

    def notify_hr_update(self, employee_id: int, message: str):
        self.create_notification(NotificationCreate(
            employee_id=employee_id,
            type=NotificationType.HR_UPDATE,
            title="HR Update",
            message=message
        ))

    def notify_salary_updated(self, employee_id: int):
        self.create_notification(NotificationCreate(
            employee_id=employee_id,
            type=NotificationType.SALARY_UPDATED,
            title="Salary Updated",
            message="Your salary structure has been updated"
        ))