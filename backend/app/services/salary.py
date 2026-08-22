from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.salary import SalaryStructure, SalaryComponent, CalculationBasis, ComponentType
from app.models.employee import Employee
from app.models.attendance import Attendance, AttendanceStatus
from app.models.time_off import TimeOffRequest, TimeOffRequestStatus, TimeOffType
from app.schemas.salary import SalaryStructureCreate, SalaryStructureUpdate, SalaryComponentCreate, SalaryCalculationResult, PayableDaysSummary


class SalaryService:
    def __init__(self, db: Session):
        self.db = db

    def get_salary_structure(self, employee_id: int) -> Optional[SalaryStructure]:
        return self.db.query(SalaryStructure).filter(
            SalaryStructure.employee_id == employee_id,
            SalaryStructure.is_active == True
        ).first()

    def get_salary_structure_by_id(self, structure_id: int) -> Optional[SalaryStructure]:
        return self.db.query(SalaryStructure).filter(SalaryStructure.id == structure_id).first()

    def create_salary_structure(self, data: SalaryStructureCreate) -> SalaryStructure:
        # Deactivate existing structure
        existing = self.get_salary_structure(data.employee_id)
        if existing:
            existing.is_active = False

        structure = SalaryStructure(
            employee_id=data.employee_id,
            wage_type=data.wage_type,
            monthly_wage=data.monthly_wage,
            yearly_wage=data.monthly_wage * 12 if data.wage_type == "monthly" else data.yearly_wage,
            effective_from=data.effective_from,
            working_days_per_month=data.working_days_per_month,
            break_time_minutes=data.break_time_minutes,
            is_active=True
        )
        self.db.add(structure)
        self.db.flush()

        # Create components
        for comp_data in data.components:
            component = SalaryComponent(
                salary_structure_id=structure.id,
                **comp_data.model_dump()
            )
            self.db.add(component)

        self.db.commit()
        self.db.refresh(structure)
        self._recalculate_components(structure)
        return structure

    def update_salary_structure(self, structure_id: int, data: SalaryStructureUpdate) -> Optional[SalaryStructure]:
        structure = self.get_salary_structure_by_id(structure_id)
        if not structure:
            return None

        update_dict = data.model_dump(exclude_unset=True, exclude={"components"})
        for key, value in update_dict.items():
            setattr(structure, key, value)

        if structure.wage_type == "monthly" and structure.monthly_wage:
            structure.yearly_wage = structure.monthly_wage * 12
        elif structure.wage_type == "yearly" and structure.yearly_wage:
            structure.monthly_wage = structure.yearly_wage / 12

        # Update components if provided
        if data.components is not None:
            # Delete existing components
            self.db.query(SalaryComponent).filter(
                SalaryComponent.salary_structure_id == structure_id
            ).delete()

            for comp_data in data.components:
                component = SalaryComponent(
                    salary_structure_id=structure.id,
                    **comp_data.model_dump()
                )
                self.db.add(component)

        self.db.commit()
        self.db.refresh(structure)
        self._recalculate_components(structure)
        return structure

    def _recalculate_components(self, structure: SalaryStructure):
        """Recalculate all component amounts based on wage and basis"""
        monthly_wage = structure.monthly_wage or Decimal("0")
        basic_amount = Decimal("0")

        # First pass: calculate basic salary
        for component in structure.components:
            if component.calculation_basis == CalculationBasis.WAGE:
                if component.percentage:
                    amount = (monthly_wage * component.percentage / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                else:
                    amount = component.fixed_amount or Decimal("0")
                component.monthly_amount = amount
                if component.name.lower() in ["basic", "basic salary", "base salary"]:
                    basic_amount = amount

        # Second pass: calculate components based on basic
        for component in structure.components:
            if component.calculation_basis == CalculationBasis.BASIC:
                if component.percentage:
                    amount = (basic_amount * component.percentage / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                else:
                    amount = component.fixed_amount or Decimal("0")
                component.monthly_amount = amount
            elif component.calculation_basis == CalculationBasis.FIXED:
                component.monthly_amount = component.fixed_amount or Decimal("0")

        self.db.commit()

    def calculate_salary(self, employee_id: int, calculation_date: Optional[date] = None) -> Optional[SalaryCalculationResult]:
        structure = self.get_salary_structure(employee_id)
        if not structure:
            return None

        if not calculation_date:
            calculation_date = date.today()

        # Get payable days for the month
        payable_days = self._calculate_payable_days(employee_id, calculation_date)

        # Calculate component amounts
        components = structure.components
        total_earnings = Decimal("0")
        total_deductions = Decimal("0")
        pf_employee = Decimal("0")
        pf_employer = Decimal("0")
        professional_tax = Decimal("0")

        for comp in components:
            if comp.component_type == ComponentType.EARNING:
                total_earnings += comp.monthly_amount
            else:
                total_deductions += comp.monthly_amount

            # Track specific components
            if comp.name.lower() in ["pf", "provident fund", "employee pf"]:
                pf_employee = comp.monthly_amount
            elif comp.name.lower() in ["employer pf", "pf employer"]:
                pf_employer = comp.monthly_amount
            elif comp.name.lower() in ["professional tax", "pt"]:
                professional_tax = comp.monthly_amount

        net_salary = total_earnings - total_deductions

        return SalaryCalculationResult(
            monthly_wage=structure.monthly_wage,
            yearly_wage=structure.yearly_wage,
            components=components,
            total_earnings=total_earnings,
            total_deductions=total_deductions,
            net_salary=net_salary,
            pf_employee=pf_employee,
            pf_employer=pf_employer,
            professional_tax=professional_tax,
            working_days=structure.working_days_per_month,
            present_days=payable_days.present_days,
            paid_leave_days=payable_days.paid_leave_days,
            unpaid_leave_days=payable_days.unpaid_leave_days,
            payable_days=payable_days.payable_days
        )

    def _calculate_payable_days(self, employee_id: int, calculation_date: date) -> PayableDaysSummary:
        # Get salary structure to access working_days_per_month
        structure = self.get_salary_structure(employee_id)
        if not structure:
            structure = SalaryStructure(working_days_per_month=26)  # fallback

        # Get first and last day of the month
        first_day = calculation_date.replace(day=1)
        if calculation_date.month == 12:
            last_day = calculation_date.replace(year=calculation_date.year + 1, month=1, day=1)
        else:
            last_day = calculation_date.replace(month=calculation_date.month + 1, day=1)
        last_day = date.fromordinal(last_day.toordinal() - 1)

        total_working_days = structure.working_days_per_month

        # Get attendance records for the month
        attendances = self.db.query(Attendance).filter(
            Attendance.employee_id == employee_id,
            Attendance.date >= first_day,
            Attendance.date <= last_day
        ).all()

        present_days = sum(1 for a in attendances if a.status == AttendanceStatus.PRESENT)

        # Get approved paid leave days
        paid_leave_types = self.db.query(TimeOffType.id).filter(TimeOffType.is_paid == True).all()
        paid_leave_type_ids = [t[0] for t in paid_leave_types]

        paid_leave_requests = self.db.query(TimeOffRequest).filter(
            TimeOffRequest.employee_id == employee_id,
            TimeOffRequest.status == TimeOffRequestStatus.APPROVED,
            TimeOffRequest.time_off_type_id.in_(paid_leave_type_ids),
            TimeOffRequest.start_date <= last_day,
            TimeOffRequest.end_date >= first_day
        ).all()

        paid_leave_days = 0
        for req in paid_leave_requests:
            # Count overlap with the month
            start = max(req.start_date, first_day)
            end = min(req.end_date, last_day)
            paid_leave_days += (end - start).days + 1

        # Get approved unpaid leave days
        unpaid_leave_type_ids = self.db.query(TimeOffType.id).filter(TimeOffType.is_paid == False).all()
        unpaid_leave_type_ids = [t[0] for t in unpaid_leave_type_ids]

        unpaid_leave_requests = self.db.query(TimeOffRequest).filter(
            TimeOffRequest.employee_id == employee_id,
            TimeOffRequest.status == TimeOffRequestStatus.APPROVED,
            TimeOffRequest.time_off_type_id.in_(unpaid_leave_type_ids),
            TimeOffRequest.start_date <= last_day,
            TimeOffRequest.end_date >= first_day
        ).all()

        unpaid_leave_days = 0
        for req in unpaid_leave_requests:
            start = max(req.start_date, first_day)
            end = min(req.end_date, last_day)
            unpaid_leave_days += (end - start).days + 1

        payable_days = present_days + paid_leave_days

        return PayableDaysSummary(
            total_working_days=total_working_days,
            present_days=present_days,
            paid_leave_days=paid_leave_days,
            unpaid_leave_days=unpaid_leave_days,
            payable_days=payable_days
        )

    def get_payable_days_summary(self, employee_id: int, calculation_date: Optional[date] = None) -> PayableDaysSummary:
        if not calculation_date:
            calculation_date = date.today()
        return self._calculate_payable_days(employee_id, calculation_date)

    def seed_default_salary_structure(self, employee_id: int, monthly_wage: Decimal, effective_from: date):
        """Create a default salary structure with standard components"""
        structure_data = SalaryStructureCreate(
            employee_id=employee_id,
            wage_type="monthly",
            monthly_wage=monthly_wage,
            effective_from=effective_from,
            working_days_per_month=26,
            break_time_minutes=60,
            components=[
                SalaryComponentCreate(
                    name="Basic Salary",
                    component_type=ComponentType.EARNING,
                    calculation_basis=CalculationBasis.WAGE,
                    percentage=Decimal("50"),
                    display_order=1
                ),
                SalaryComponentCreate(
                    name="House Rent Allowance",
                    component_type=ComponentType.EARNING,
                    calculation_basis=CalculationBasis.BASIC,
                    percentage=Decimal("50"),
                    display_order=2
                ),
                SalaryComponentCreate(
                    name="Standard Allowance",
                    component_type=ComponentType.EARNING,
                    calculation_basis=CalculationBasis.WAGE,
                    percentage=Decimal("10"),
                    display_order=3
                ),
                SalaryComponentCreate(
                    name="Performance Bonus",
                    component_type=ComponentType.EARNING,
                    calculation_basis=CalculationBasis.BASIC,
                    percentage=Decimal("8.33"),
                    display_order=4
                ),
                SalaryComponentCreate(
                    name="Leave Travel Allowance",
                    component_type=ComponentType.EARNING,
                    calculation_basis=CalculationBasis.WAGE,
                    percentage=Decimal("5"),
                    display_order=5
                ),
                SalaryComponentCreate(
                    name="Fixed Allowance",
                    component_type=ComponentType.EARNING,
                    calculation_basis=CalculationBasis.FIXED,
                    fixed_amount=Decimal("5000"),
                    display_order=6
                ),
                SalaryComponentCreate(
                    name="Provident Fund (Employee)",
                    component_type=ComponentType.DEDUCTION,
                    calculation_basis=CalculationBasis.BASIC,
                    percentage=Decimal("12"),
                    display_order=7
                ),
                SalaryComponentCreate(
                    name="Professional Tax",
                    component_type=ComponentType.DEDUCTION,
                    calculation_basis=CalculationBasis.FIXED,
                    fixed_amount=Decimal("200"),
                    display_order=8
                ),
            ]
        )
        return self.create_salary_structure(structure_data)