from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.document import DocumentType


class DocumentBase(BaseModel):
    employee_id: int
    type: DocumentType
    name: str
    file_url: str


class DocumentCreate(DocumentBase):
    pass


class DocumentResponse(DocumentBase):
    id: int
    uploaded_by_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True