from typing import Optional, List
from datetime import date, datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from app.models.time_off import TimeOffType, TimeOffRequest, TimeOffAllocation, TimeOffRequestStatus, TimeOffTypeEnum
from app.models.employee import Employee
from app.models.attendance import Attendance, AttendanceStatus
from app.schemas.time_off import TimeOffTypeCreate, TimeOffRequestCreate, TimeOffRequestAdminAction, TimeOffAllocationCreate, TimeOffAllocationUpdate


class TimeOffService:
    def __init__(self, db: Session):
        self.db = db

    # Time Off Types
    def get_time_off_types(self) -> List[TimeOffType]:
        return self.db.query(TimeOffType).all()

    def get_time_off_type_by_id(self, type_id: int) -> Optional[TimeOffType]:
        return self.db.query(TimeOffType).filter(TimeOffType.id == type_id).first()

    def create_time_off_type(self, data: TimeOffTypeCreate) -> TimeOffType:
        time_off_type = TimeOffType(**data.model_dump())
        self.db.add(time_off_type)
        self.db.commit()
        self.db.refresh(time_off_type)
        return time_off_type

    def seed_default_time_off_types(self):
        defaults = [
            {"name": "Paid Time Off", "description": "Annual paid leave", "is_paid": True, "color": "#10B981"},
            {"name": "Sick Leave", "description": "Medical leave with certificate", "is_paid": True, "color": "#EF4444"},
            {"name": "Unpaid Leave", "description": "Leave without pay", "is_paid": False, "color": "#F59E0B"},
        ]
        for d in defaults:
            existing = self.db.query(TimeOffType).filter(TimeOffType.name == d["name"]).first()
            if not existing:
                self.db.add(TimeOffType(**d))
        self.db.commit()

    # Time Off Requests
    def get_time_off_request(self, request_id: int) -> Optional[TimeOffRequest]:
        return self.db.query(TimeOffRequest).filter(TimeOffRequest.id == request_id).first()

    def get_employee_requests(
        self,
        employee_id: int,
        status: Optional[TimeOffRequestStatus] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[TimeOffRequest]:
        query = self.db.query(TimeOffRequest).filter(TimeOffRequest.employee_id == employee_id)
        if status:
            query = query.filter(TimeOffRequest.status == status)
        if start_date:
            query = query.filter(TimeOffRequest.start_date >= start_date)
        if end_date:
            query = query.filter(TimeOffRequest.end_date <= end_date)
        return query.order_by(TimeOffRequest.created_at.desc()).all()

    def get_all_requests(
        self,
        status: Optional[TimeOffRequestStatus] = None,
        employee_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[TimeOffRequest], int]:
        query = self.db.query(TimeOffRequest).join(Employee)
        if status:
            query = query.filter(TimeOffRequest.status == status)
        if employee_id:
            query = query.filter(TimeOffRequest.employee_id == employee_id)
        if start_date:
            query = query.filter(TimeOffRequest.start_date >= start_date)
        if end_date:
            query = query.filter(TimeOffRequest.end_date <= end_date)

        total = query.count()
        requests = query.order_by(TimeOffRequest.created_at.desc()).offset(
            (page - 1) * page_size
        ).limit(page_size).all()
        return requests, total

    def create_request(self, employee_id: int, data: TimeOffRequestCreate) -> TimeOffRequest:
        # Calculate total days
        total_days = (data.end_date - data.start_date).days + 1

        # Check available balance for paid types
        time_off_type = self.get_time_off_type_by_id(data.time_off_type_id)
        if time_off_type and time_off_type.is_paid:
            allocation = self.get_allocation(employee_id, data.time_off_type_id, data.start_date.year)
            if allocation and allocation.available_days < total_days:
                raise ValueError(f"Insufficient {time_off_type.name} balance. Available: {allocation.available_days} days")

        request = TimeOffRequest(
            employee_id=employee_id,
            time_off_type_id=data.time_off_type_id,
            start_date=data.start_date,
            end_date=data.end_date,
            total_days=total_days,
            reason=data.reason,
            attachment_url=data.attachment_url,
            status=TimeOffRequestStatus.PENDING
        )
        self.db.add(request)
        self.db.commit()
        self.db.refresh(request)
        return request

    def update_request(self, request_id: int, data: TimeOffRequestCreate) -> Optional[TimeOffRequest]:
        request = self.get_time_off_request(request_id)
        if not request or request.status != TimeOffRequestStatus.PENDING:
            return None

        total_days = (data.end_date - data.start_date).days + 1
        request.time_off_type_id = data.time_off_type_id
        request.start_date = data.start_date
        request.end_date = data.end_date
        request.total_days = total_days
        request.reason = data.reason
        request.attachment_url = data.attachment_url
        self.db.commit()
        self.db.refresh(request)
        return request

    def approve_request(self, request_id: int, approver_id: int) -> Optional[TimeOffRequest]:
        request = self.get_time_off_request(request_id)
        if not request or request.status != TimeOffRequestStatus.PENDING:
            return None

        request.status = TimeOffRequestStatus.APPROVED
        request.approved_by_id = approver_id
        request.approved_at = datetime.utcnow()

        # Update allocation used days
        if request.time_off_type and request.time_off_type.is_paid:
            allocation = self.get_allocation(request.employee_id, request.time_off_type_id, request.start_date.year)
            if allocation:
                allocation.used_days += request.total_days

        # Create attendance records for the leave period
        self._create_leave_attendance_records(request)

        self.db.commit()
        self.db.refresh(request)
        return request

    def reject_request(self, request_id: int, approver_id: int, rejection_reason: str) -> Optional[TimeOffRequest]:
        request = self.get_time_off_request(request_id)
        if not request or request.status != TimeOffRequestStatus.PENDING:
            return None

        request.status = TimeOffRequestStatus.REJECTED
        request.approved_by_id = approver_id
        request.approved_at = datetime.utcnow()
        request.rejection_reason = rejection_reason

        self.db.commit()
        self.db.refresh(request)
        return request

    def cancel_request(self, request_id: int, employee_id: int) -> Optional[TimeOffRequest]:
        request = self.get_time_off_request(request_id)
        if not request or request.employee_id != employee_id or request.status != TimeOffRequestStatus.PENDING:
            return None

        request.status = TimeOffRequestStatus.CANCELLED
        self.db.commit()
        self.db.refresh(request)
        return request

    def _create_leave_attendance_records(self, request: TimeOffRequest):
        """Create attendance records for approved leave days"""
        current_date = request.start_date
        while current_date <= request.end_date:
            existing = self.db.query(Attendance).filter(
                Attendance.employee_id == request.employee_id,
                Attendance.date == current_date
            ).first()
            if not existing:
                attendance = Attendance(
                    employee_id=request.employee_id,
                    date=current_date,
                    status=AttendanceStatus.ON_LEAVE,
                    notes=f"On {request.time_off_type.name if request.time_off_type else 'leave'}"
                )
                self.db.add(attendance)
            current_date = date.fromordinal(current_date.toordinal() + 1)

    # Time Off Allocations
    def get_allocation(self, employee_id: int, time_off_type_id: int, year: int) -> Optional[TimeOffAllocation]:
        return self.db.query(TimeOffAllocation).filter(
            TimeOffAllocation.employee_id == employee_id,
            TimeOffAllocation.time_off_type_id == time_off_type_id,
            TimeOffAllocation.year == year
        ).first()

    def get_employee_allocations(self, employee_id: int, year: Optional[int] = None) -> List[TimeOffAllocation]:
        query = self.db.query(TimeOffAllocation).filter(TimeOffAllocation.employee_id == employee_id)
        if year:
            query = query.filter(TimeOffAllocation.year == year)
        return query.all()

    def create_allocation(self, data: TimeOffAllocationCreate) -> TimeOffAllocation:
        allocation = TimeOffAllocation(**data.model_dump())
        self.db.add(allocation)
        self.db.commit()
        self.db.refresh(allocation)
        return allocation

    def update_allocation(self, allocation_id: int, data: TimeOffAllocationUpdate) -> Optional[TimeOffAllocation]:
        allocation = self.db.query(TimeOffAllocation).filter(TimeOffAllocation.id == allocation_id).first()
        if not allocation:
            return None

        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(allocation, key, value)

        self.db.commit()
        self.db.refresh(allocation)
        return allocation

    def seed_default_allocations(self, employee_id: int, year: int):
        """Create default allocations for a new employee"""
        types = self.get_time_off_types()
        defaults = {
            "Paid Time Off": 15,
            "Sick Leave": 10,
            "Unpaid Leave": 0
        }
        for t in types:
            if t.name in defaults:
                existing = self.get_allocation(employee_id, t.id, year)
                if not existing:
                    allocation = TimeOffAllocation(
                        employee_id=employee_id,
                        time_off_type_id=t.id,
                        year=year,
                        allocated_days=defaults[t.name],
                        used_days=0,
                        carry_over_days=0
                    )
                    self.db.add(allocation)
        self.db.commit()

    def get_balances(self, employee_id: int, year: Optional[int] = None) -> List[dict]:
        if not year:
            year = date.today().year
        allocations = self.get_employee_allocations(employee_id, year)
        return [
            {
                "time_off_type": a.time_off_type,
                "allocated_days": a.allocated_days,
                "used_days": a.used_days,
                "carry_over_days": a.carry_over_days,
                "available_days": a.available_days
            }
            for a in allocations
        ]