from typing import Optional, List
from datetime import date, time, datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from app.models.attendance import Attendance, AttendanceStatus
from app.models.employee import Employee
from app.models.time_off import TimeOffRequest, TimeOffRequestStatus
from app.schemas.attendance import AttendanceCreate, AttendanceUpdate, AdminAttendanceFilter, AttendanceSummary


class AttendanceService:
    def __init__(self, db: Session):
        self.db = db

    def get_attendance_by_id(self, attendance_id: int) -> Optional[Attendance]:
        return self.db.query(Attendance).filter(Attendance.id == attendance_id).first()

    def get_attendance(self, employee_id: int, attendance_date: date) -> Optional[Attendance]:
        return self.db.query(Attendance).filter(
            Attendance.employee_id == employee_id,
            Attendance.date == attendance_date
        ).first()

    def get_employee_attendance(
        self,
        employee_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Attendance]:
        query = self.db.query(Attendance).filter(Attendance.employee_id == employee_id)
        if start_date:
            query = query.filter(Attendance.date >= start_date)
        if end_date:
            query = query.filter(Attendance.date <= end_date)
        return query.order_by(Attendance.date.desc()).all()

    def get_admin_attendance(self, filters: AdminAttendanceFilter) -> tuple[List[Attendance], int]:
        query = self.db.query(Attendance).join(Employee)

        if filters.employee_id:
            query = query.filter(Attendance.employee_id == filters.employee_id)
        if filters.start_date:
            query = query.filter(Attendance.date >= filters.start_date)
        if filters.end_date:
            query = query.filter(Attendance.date <= filters.end_date)
        if filters.status:
            query = query.filter(Attendance.status == filters.status)

        total = query.count()
        attendances = query.order_by(Attendance.date.desc()).offset(
            (filters.page - 1) * filters.page_size
        ).limit(filters.page_size).all()
        return attendances, total

    def check_in(self, employee_id: int, attendance_date: date, check_in_time: time, notes: Optional[str] = None) -> Attendance:
        existing = self.get_attendance(employee_id, attendance_date)
        if existing:
            if existing.check_in:
                raise ValueError("Already checked in today")
            existing.check_in = check_in_time
            existing.notes = notes
            existing.status = AttendanceStatus.PRESENT
            attendance = existing
        else:
            attendance = Attendance(
                employee_id=employee_id,
                date=attendance_date,
                check_in=check_in_time,
                status=AttendanceStatus.PRESENT,
                notes=notes
            )
            self.db.add(attendance)

        self.db.commit()
        self.db.refresh(attendance)
        return attendance

    def check_out(self, employee_id: int, attendance_date: date, check_out_time: time, notes: Optional[str] = None) -> Attendance:
        attendance = self.get_attendance(employee_id, attendance_date)
        if not attendance:
            raise ValueError("No check-in record found for today")
        if not attendance.check_in:
            raise ValueError("Must check in first")
        if attendance.check_out:
            raise ValueError("Already checked out today")

        attendance.check_out = check_out_time
        attendance.notes = notes

        # Calculate work hours
        check_in_dt = datetime.combine(attendance_date, attendance.check_in)
        check_out_dt = datetime.combine(attendance_date, check_out_time)
        if check_out_dt < check_in_dt:
            check_out_dt += timedelta(days=1)
        work_minutes = int((check_out_dt - check_in_dt).total_seconds() / 60)
        attendance.work_hours = work_minutes

        # Calculate extra hours (beyond 8 hours = 480 minutes)
        standard_hours = 480
        if work_minutes > standard_hours:
            attendance.extra_hours = work_minutes - standard_hours

        self.db.commit()
        self.db.refresh(attendance)
        return attendance

    def update_attendance(self, attendance_id: int, update_data: AttendanceUpdate) -> Optional[Attendance]:
        attendance = self.get_attendance_by_id(attendance_id)
        if not attendance:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(attendance, key, value)

        # Recalculate work hours if both check_in and check_out exist
        if attendance.check_in and attendance.check_out:
            check_in_dt = datetime.combine(attendance.date, attendance.check_in)
            check_out_dt = datetime.combine(attendance.date, attendance.check_out)
            if check_out_dt < check_in_dt:
                check_out_dt += timedelta(days=1)
            work_minutes = int((check_out_dt - check_in_dt).total_seconds() / 60)
            attendance.work_hours = work_minutes
            if work_minutes > 480:
                attendance.extra_hours = work_minutes - 480

        self.db.commit()
        self.db.refresh(attendance)
        return attendance

    def get_attendance_summary(
        self,
        employee_id: int,
        start_date: date,
        end_date: date
    ) -> AttendanceSummary:
        attendances = self.get_employee_attendance(employee_id, start_date, end_date)

        total_working_days = (end_date - start_date).days + 1
        present_days = sum(1 for a in attendances if a.status == AttendanceStatus.PRESENT)
        absent_days = sum(1 for a in attendances if a.status == AttendanceStatus.ABSENT)
        late_days = sum(1 for a in attendances if a.status == AttendanceStatus.LATE)
        half_days = sum(1 for a in attendances if a.status == AttendanceStatus.HALF_DAY)
        on_leave_days = sum(1 for a in attendances if a.status == AttendanceStatus.ON_LEAVE)
        total_work_hours = sum(a.work_hours for a in attendances)
        total_extra_hours = sum(a.extra_hours for a in attendances)

        return AttendanceSummary(
            total_working_days=total_working_days,
            present_days=present_days,
            absent_days=absent_days,
            late_days=late_days,
            half_days=half_days,
            on_leave_days=on_leave_days,
            total_work_hours=total_work_hours,
            total_extra_hours=total_extra_hours
        )

    def get_today_status(self, employee_id: int) -> str:
        today = date.today()
        attendance = self.get_attendance(employee_id, today)
        if attendance:
            if attendance.status == AttendanceStatus.PRESENT:
                return "present"
            elif attendance.status == AttendanceStatus.ON_LEAVE:
                return "on_leave"
            else:
                return "absent"

        # Check approved leave
        leave = self.db.query(TimeOffRequest).filter(
            TimeOffRequest.employee_id == employee_id,
            TimeOffRequest.start_date <= today,
            TimeOffRequest.end_date >= today,
            TimeOffRequest.status == TimeOffRequestStatus.APPROVED
        ).first()
        if leave:
            return "on_leave"
        return "absent"