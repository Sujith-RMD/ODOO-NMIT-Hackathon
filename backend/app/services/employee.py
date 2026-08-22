from typing import Optional, List
from datetime import date
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from app.models.employee import Employee, EmploymentStatus
from app.models.user import User, UserRole
from app.models.attendance import Attendance, AttendanceStatus
from app.models.time_off import TimeOffAllocation, TimeOffRequest, TimeOffRequestStatus
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse, EmployeeCardResponse


class EmployeeService:
    def __init__(self, db: Session):
        self.db = db

    def get_employee_by_id(self, employee_id: int) -> Optional[Employee]:
        return self.db.query(Employee).filter(Employee.id == employee_id).first()

    def get_employee_by_user_id(self, user_id: int) -> Optional[Employee]:
        return self.db.query(Employee).filter(Employee.user_id == user_id).first()

    def get_all_employees(
        self,
        search: Optional[str] = None,
        department: Optional[str] = None,
        status: Optional[EmploymentStatus] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Employee], int]:
        query = self.db.query(Employee).options(joinedload(Employee.user))

        if search:
            search_term = f"%{search}%"
            query = query.join(User).filter(
                or_(
                    Employee.first_name.ilike(search_term),
                    Employee.last_name.ilike(search_term),
                    Employee.full_name.ilike(search_term),
                    User.login_id.ilike(search_term),
                    Employee.department.ilike(search_term)
                )
            )

        if department:
            query = query.filter(Employee.department == department)

        if status:
            query = query.filter(Employee.status == status)

        total = query.count()
        employees = query.offset((page - 1) * page_size).limit(page_size).all()
        return employees, total

    def get_departments(self) -> List[str]:
        departments = self.db.query(Employee.department).filter(Employee.department.isnot(None)).distinct().all()
        return [d[0] for d in departments]

    def create_employee(self, employee_data: EmployeeCreate, user_id: int) -> Employee:
        employee = Employee(user_id=user_id, **employee_data.model_dump())
        self.db.add(employee)
        self.db.commit()
        self.db.refresh(employee)
        return employee

    def update_employee(self, employee_id: int, update_data: EmployeeUpdate) -> Optional[Employee]:
        employee = self.get_employee_by_id(employee_id)
        if not employee:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(employee, key, value)

        self.db.commit()
        self.db.refresh(employee)
        return employee

    def delete_employee(self, employee_id: int) -> bool:
        employee = self.get_employee_by_id(employee_id)
        if not employee:
            return False
        self.db.delete(employee)
        self.db.commit()
        return True

    def get_employee_card_data(self, employee: Employee) -> EmployeeCardResponse:
        # Get today's attendance status
        today = date.today()
        attendance = self.db.query(Attendance).filter(
            Attendance.employee_id == employee.id,
            Attendance.date == today
        ).first()

        if attendance:
            if attendance.status == AttendanceStatus.PRESENT:
                status = "present"
            elif attendance.status == AttendanceStatus.ON_LEAVE:
                status = "on_leave"
            else:
                status = "absent"
        else:
            # Check if on approved leave today
            leave = self.db.query(TimeOffRequest).filter(
                TimeOffRequest.employee_id == employee.id,
                TimeOffRequest.start_date <= today,
                TimeOffRequest.end_date >= today,
                TimeOffRequest.status == TimeOffRequestStatus.APPROVED
            ).first()
            if leave:
                status = "on_leave"
            else:
                status = "absent"

        return EmployeeCardResponse(
            id=employee.id,
            full_name=employee.full_name,
            initials=employee.initials,
            avatar_url=employee.avatar_url,
            department=employee.department,
            position=employee.position,
            login_id=employee.user.login_id if employee.user else "",
            status=status
        )

    def get_employee_profile(self, employee_id: int) -> Optional[dict]:
        employee = self.db.query(Employee).options(
            joinedload(Employee.user),
            joinedload(Employee.manager)
        ).filter(Employee.id == employee_id).first()

        if not employee:
            return None

        # Get today's attendance
        today = date.today()
        attendance_today = self.db.query(Attendance).filter(
            Attendance.employee_id == employee_id,
            Attendance.date == today
        ).first()

        # Get time off balances
        allocations = self.db.query(TimeOffAllocation).filter(
            TimeOffAllocation.employee_id == employee_id,
            TimeOffAllocation.year == today.year
        ).all()

        # Get subordinates count
        subordinates_count = self.db.query(Employee).filter(Employee.manager_id == employee_id).count()

        return {
            "employee": employee,
            "attendance_today": attendance_today,
            "time_off_balances": allocations,
            "subordinates_count": subordinates_count
        }