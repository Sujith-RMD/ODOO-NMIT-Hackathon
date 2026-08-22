from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class DocumentType(str, enum.Enum):
    MEDICAL_CERTIFICATE = "medical_certificate"
    ID_PROOF = "id_proof"
    ADDRESS_PROOF = "address_proof"
    BANK_DOCUMENT = "bank_document"
    OTHER = "other"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    type = Column(SQLEnum(DocumentType), nullable=False)
    name = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    employee = relationship("Employee", foreign_keys=[employee_id], back_populates="documents")
    uploaded_by = relationship("Employee", foreign_keys=[uploaded_by_id])

    def __repr__(self):
        return f"<Document(id={self.id}, employee_id={self.employee_id}, type='{self.type}', name='{self.name}')>"