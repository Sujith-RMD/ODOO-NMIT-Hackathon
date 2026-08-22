"""Seed script for DAYFLOW HRMS"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, Base, engine
from app.config import settings
from app.services.auth import AuthService
from app.services.employee import EmployeeService
from app.services.time_off import TimeOffService
from app.services.salary import SalaryService
from app.services.notification import NotificationService
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.attendance import Attendance, AttendanceStatus
from app.models.time_off import TimeOffType, TimeOffRequest, TimeOffAllocation, TimeOffRequestStatus
from app.models.salary import SalaryStructure, SalaryComponent
from app.models.notification import Notification
from app.models.document import Document
from app.schemas.employee import EmployeeCreate
from datetime import date, time, datetime, timedelta
from decimal import Decimal
import random

# Departments
DEPARTMENTS = ["Engineering", "Design", "Sales", "Marketing", "Human Resources", "Finance", "Operations"]

# Sample employees data (first_name, last_name, department, position)
EMPLOYEES_DATA = [
    ("John", "Doe", "Engineering", "Senior Software Engineer"),
    ("Sarah", "Smith", "Design", "UX Designer"),
    ("Michael", "Brown", "Sales", "Sales Manager"),
    ("Emily", "Davis", "Marketing", "Content Strategist"),
    ("David", "Wilson", "Engineering", "Full Stack Developer"),
    ("Jessica", "Taylor", "Human Resources", "HR Specialist"),
    ("James", "Anderson", "Finance", "Financial Analyst"),
    ("Laura", "Thomas", "Operations", "Operations Lead"),
    ("Robert", "Jackson", "Engineering", "DevOps Engineer"),
    ("Maria", "Garcia", "Design", "Product Designer"),
    ("William", "Martin", "Sales", "Account Executive"),
    ("Linda", "Lee", "Marketing", "SEO Specialist"),
]


def seed():
    db = SessionLocal()

    try:
        # Create admin user
        admin_auth = AuthService(db)
        admin_user = db.query(User).filter(User.login_id == "OIAD2024001").first()
        if not admin_user:
            admin_employee_data = EmployeeCreate(
                first_name="Admin",
                last_name="HR",
                email="admin@dayflow.com",
                phone="+1234567890",
                department="Human Resources",
                position="HR Officer",
                location="New York",
                date_of_joining=date(2024, 1, 1),
                date_of_birth=date(1990, 5, 15),
                address="123 HR Street, New York, NY",
                nationality="American",
                gender="Female",
                marital_status="Married",
                personal_email="admin.personal@dayflow.com",
                bank_account_number="1234567890",
                bank_name="Chase Bank",
                ifsc_code="CHASUS33",
                pan_number="ABCTY1234D",
                uan_number="100123456789",
                employee_code="OI-HR-001",
                about="HR Officer responsible for employee management and payroll.",
                interests="Reading, Travel",
                skills="HR Management, Recruitment, Payroll",
                certifications="SHRM-CP, PHR"
            )
            admin_user, admin_employee = admin_auth.create_employee_with_user(admin_employee_data, "admin123")

            # Make admin
            admin_user.role = UserRole.ADMIN
            db.commit()

            # Seed time off types
            time_off_service = TimeOffService(db)
            time_off_service.seed_default_time_off_types()

            # Seed allocations for admin
            time_off_service.seed_default_allocations(admin_employee.id, 2024)

            print(f"Created admin: {admin_user.login_id}")

        # Get time off types
        time_off_service = TimeOffService(db)
        time_off_types = time_off_service.get_time_off_types()
        paid_type = next((t for t in time_off_types if t.name == "Paid Time Off"), None)
        sick_type = next((t for t in time_off_types if t.name == "Sick Leave"), None)
        unpaid_type = next((t for t in time_off_types if t.name == "Unpaid Leave"), None)

        # Create employees
        employee_service = EmployeeService(db)
        salary_service = SalaryService(db)

        existing_count = db.query(Employee).count()
        passwords = ["emp12345", "emp12345", "emp12345", "emp12345", "emp12345", "emp12345"]

        for i, (first, last, dept, pos) in enumerate(EMPLOYEES_DATA):
            # Check if already exists
            user = db.query(User).filter(User.email == f"{first.lower()}.{last.lower()}@dayflow.com").first()
            if user:
                continue

            employee_data = EmployeeCreate(
                first_name=first,
                last_name=last,
                email=f"{first.lower()}.{last.lower()}@dayflow.com",
                phone=f"+1555{100000 + i}",
                department=dept,
                position=pos,
                manager_id=admin_employee.id,
                location="Remote",
                date_of_joining=date(2024, random.randint(1, 12), random.randint(1, 28)),
                date_of_birth=date(random.randint(1985, 2000), random.randint(1, 12), random.randint(1, 28)),
                address=f"{random.randint(100, 999)} Main St, City, State",
                nationality="American",
                gender=random.choice(["Male", "Female"]),
                marital_status=random.choice(["Single", "Married"]),
                personal_email=f"{first.lower()}.{last.lower()}.personal@dayflow.com",
                bank_account_number=f"{random.randint(1000000000, 9999999999)}",
                bank_name=random.choice(["Chase", "Bank of America", "Wells Fargo"]),
                ifsc_code=f"BOFAUS{random.randint(10, 99)}",
                pan_number=f"ABCDE{random.randint(1000, 9999)}F",
                uan_number=f"100{random.randint(100000000, 999999999)}",
                employee_code=f"OI-{dept[:2].upper()}-{i+1:03d}",
                about=f"Dedicated {pos} with {random.randint(2, 10)} years of experience.",
                interests="Technology, Sports, Music",
                skills=f"{pos}, Teamwork, Communication",
                certifications=random.choice(["Bachelor's Degree", "Master's Degree", "Professional Certificate"])
            )

            user, employee = admin_auth.create_employee_with_user(employee_data, "emp12345")

            # Seed allocations
            time_off_service.seed_default_allocations(employee.id, 2024)

            # Seed salary structure
            monthly_wage = Decimal(str(random.choice([45000, 50000, 55000, 60000, 65000, 70000, 75000, 80000])))
            salary_service.seed_default_salary_structure(employee.id, monthly_wage, employee.date_of_joining)

            # Seed attendance for current month
            seed_attendance(db, employee.id, Attendance)

            # Seed some time off requests
            seed_time_off_requests(db, employee.id, time_off_types)

            print(f"Created employee: {user.login_id} - {employee.full_name}")

        # Create some notifications
        notification_service = NotificationService(db)
        notification_service.notify_employee_created(admin_employee.id, "System")

        # Seed some pending requests for admin to approve
        seed_pending_requests(db, admin_employee.id, time_off_types)

        db.commit()
        print("\nSeed data created successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


def seed_attendance(db, employee_id, Attendance):
    """Seed attendance for the past 15 days"""
    today = date.today()
    for i in range(15):
        day = today - timedelta(days=i)
        if day.weekday() >= 5:  # Skip weekends
            continue

        # Random attendance state
        state = random.choice([
            AttendanceStatus.PRESENT,
            AttendanceStatus.PRESENT,
            AttendanceStatus.PRESENT,
            AttendanceStatus.LATE,
            AttendanceStatus.ABSENT,
            AttendanceStatus.ON_LEAVE
        ])

        if state == AttendanceStatus.PRESENT:
            check_in = time(9, random.randint(0, 15))
            check_out = time(17, random.randint(0, 30))
            check_in_dt = datetime.combine(day, check_in)
            check_out_dt = datetime.combine(day, check_out)
            work_minutes = int((check_out_dt - check_in_dt).total_seconds() / 60)
            extra_hours = max(0, work_minutes - 480)

            attendance = Attendance(
                employee_id=employee_id,
                date=day,
                check_in=check_in,
                check_out=check_out,
                work_hours=work_minutes,
                extra_hours=extra_hours,
                status=AttendanceStatus.PRESENT
            )
            db.add(attendance)

        elif state == AttendanceStatus.LATE:
            check_in = time(10, random.randint(0, 30))
            check_out = time(18, random.randint(0, 30))
            check_in_dt = datetime.combine(day, check_in)
            check_out_dt = datetime.combine(day, check_out)
            work_minutes = int((check_out_dt - check_in_dt).total_seconds() / 60)

            attendance = Attendance(
                employee_id=employee_id,
                date=day,
                check_in=check_in,
                check_out=check_out,
                work_hours=work_minutes,
                status=AttendanceStatus.LATE
            )
            db.add(attendance)

        elif state == AttendanceStatus.ABSENT:
            attendance = Attendance(
                employee_id=employee_id,
                date=day,
                status=AttendanceStatus.ABSENT
            )
            db.add(attendance)

        elif state == AttendanceStatus.ON_LEAVE:
            attendance = Attendance(
                employee_id=employee_id,
                date=day,
                status=AttendanceStatus.ON_LEAVE
            )
            db.add(attendance)


def seed_time_off_requests(db, employee_id, time_off_types):
    """Seed some time off requests"""
    today = date.today()
    paid_type = next((t for t in time_off_types if t.name == "Paid Time Off"), None)
    sick_type = next((t for t in time_off_types if t.name == "Sick Leave"), None)

    if random.random() > 0.5 and paid_type:
        start = today + timedelta(days=random.randint(5, 20))
        end = start + timedelta(days=random.randint(1, 3))
        request = TimeOffRequest(
            employee_id=employee_id,
            time_off_type_id=paid_type.id,
            start_date=start,
            end_date=end,
            total_days=(end - start).days + 1,
            reason="Family vacation",
            status=TimeOffRequestStatus.APPROVED if random.random() > 0.5 else TimeOffRequestStatus.PENDING
        )
        db.add(request)

    if random.random() > 0.7 and sick_type:
        start = today - timedelta(days=random.randint(5, 15))
        request = TimeOffRequest(
            employee_id=employee_id,
            time_off_type_id=sick_type.id,
            start_date=start,
            end_date=start,
            total_days=1,
            reason="Medical appointment",
            status=TimeOffRequestStatus.APPROVED if random.random() > 0.5 else TimeOffRequestStatus.PENDING
        )
        db.add(request)


def seed_pending_requests(db, admin_employee_id, time_off_types):
    """Seed some pending requests for admin to approve"""
    # Get some employees
    employees = db.query(Employee).filter(Employee.id != admin_employee_id).limit(5).all()
    if not employees:
        return

    paid_type = next((t for t in time_off_types if t.name == "Paid Time Off"), None)
    sick_type = next((t for t in time_off_types if t.name == "Sick Leave"), None)

    for i, emp in enumerate(employees[:3]):
        if paid_type and i % 2 == 0:
            start = date.today() + timedelta(days=10 + i)
            end = start + timedelta(days=2)
            request = TimeOffRequest(
                employee_id=emp.id,
                time_off_type_id=paid_type.id,
                start_date=start,
                end_date=end,
                total_days=3,
                reason="Personal leave",
                status=TimeOffRequestStatus.PENDING
            )
            db.add(request)

        if sick_type and i % 2 == 1:
            start = date.today() - timedelta(days=3)
            request = TimeOffRequest(
                employee_id=emp.id,
                time_off_type_id=sick_type.id,
                start_date=start,
                end_date=start,
                total_days=1,
                reason="Feeling unwell",
                status=TimeOffRequestStatus.PENDING
            )
            db.add(request)


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    seed()
