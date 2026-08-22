from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.notification import NotificationType
from app.schemas.common import PaginatedResponse


class NotificationBase(BaseModel):
    employee_id: int
    type: NotificationType
    title: str
    message: Optional[str] = None
    reference_id: Optional[int] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationResponse(NotificationBase):
    id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationMarkRead(BaseModel):
    notification_ids: List[int]


class UnreadCountResponse(BaseModel):
    unread_count: int