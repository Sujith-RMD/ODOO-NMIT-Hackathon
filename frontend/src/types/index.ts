// ── User & Auth ──────────────────────────────────────────────

export type UserRole = 'admin' | 'employee';

export interface User {
  id: number;
  login_id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  login_id: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface SignUpRequest {
  company_name: string;
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  phone: string;
  logo?: File;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// ── Employee ─────────────────────────────────────────────────

export type TodayStatus = 'present' | 'on_leave' | 'absent';

export interface EmployeeCard {
  id: number;
  full_name: string;
  initials: string;
  avatar_url: string | null;
  department: string | null;
  position: string | null;
  login_id: string;
  status: TodayStatus;
}

export interface Employee {
  id: number;
  user_id: number | null;
  login_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  department: string | null;
  position: string | null;
  manager_id: number | null;
  location: string | null;
  date_of_joining: string;
  date_of_birth: string | null;
  address: string | null;
  nationality: string | null;
  gender: string | null;
  marital_status: string | null;
  personal_email: string | null;
  bank_account_number: string | null;
  bank_name: string | null;
  ifsc_code: string | null;
  pan_number: string | null;
  uan_number: string | null;
  employee_code: string | null;
  avatar_url: string | null;
  status: string;
  full_name: string;
  initials: string;
  about: string | null;
  interests: string | null;
  skills: string | null;
  certifications: string | null;
  created_at: string;
  updated_at: string;
  user: User | null;
}

export interface EmployeeProfile extends Employee {
  manager: Employee | null;
  subordinates_count: number;
  attendance_today: AttendanceRecord | null;
  time_off_balances: TimeOffAllocation[];
}

export interface EmployeeCreateRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  manager_id?: number;
  location?: string;
  date_of_joining: string;
  date_of_birth?: string;
  address?: string;
  nationality?: string;
  gender?: string;
  marital_status?: string;
  personal_email?: string;
  bank_account_number?: string;
  bank_name?: string;
  ifsc_code?: string;
  pan_number?: string;
  uan_number?: string;
  employee_code?: string;
  about?: string;
  interests?: string;
  skills?: string;
  certifications?: string;
}

// ── Attendance ───────────────────────────────────────────────

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  date: string;
  check_in: string | null;
  check_out: string | null;
  work_hours: number;
  extra_hours: number;
  status: AttendanceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSummary {
  total_working_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  half_days: number;
  on_leave_days: number;
  total_work_hours: number;
  total_extra_hours: number;
}

export interface CheckInResponse {
  attendance: AttendanceRecord;
  message: string;
}

export interface CheckOutResponse {
  attendance: AttendanceRecord;
  message: string;
  work_hours: number;
  extra_hours: number;
}

// ── Time Off ─────────────────────────────────────────────────

export type TimeOffRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface TimeOffType {
  id: number;
  name: string;
  description: string | null;
  is_paid: boolean;
  color: string;
  created_at: string;
}

export interface TimeOffRequest {
  id: number;
  employee_id: number;
  time_off_type_id: number;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  status: TimeOffRequestStatus;
  approved_by_id: number | null;
  approved_at: string | null;
  rejection_reason: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
  employee: Employee | null;
  approver: Employee | null;
  time_off_type: TimeOffType | null;
}

export interface TimeOffAllocation {
  id: number;
  employee_id: number;
  time_off_type_id: number;
  year: number;
  allocated_days: number;
  used_days: number;
  carry_over_days: number;
  available_days: number;
  created_at: string;
  updated_at: string;
  time_off_type: TimeOffType | null;
}

export interface TimeOffBalance {
  time_off_type: TimeOffType;
  allocated_days: number;
  used_days: number;
  carry_over_days: number;
  available_days: number;
}

export interface TimeOffRequestCreate {
  time_off_type_id: number;
  start_date: string;
  end_date: string;
  reason?: string;
  attachment_url?: string;
}

// ── Salary ───────────────────────────────────────────────────

export type CalculationBasis = 'wage' | 'basic' | 'fixed';
export type ComponentType = 'earning' | 'deduction';

export interface SalaryComponent {
  id: number;
  salary_structure_id: number;
  name: string;
  component_type: ComponentType;
  calculation_basis: CalculationBasis;
  percentage: number;
  fixed_amount: number;
  monthly_amount: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SalaryStructure {
  id: number;
  employee_id: number;
  wage_type: string;
  monthly_wage: number;
  yearly_wage: number;
  effective_from: string;
  working_days_per_month: number;
  break_time_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  components: SalaryComponent[];
}

export interface SalaryCalculationResult {
  monthly_wage: number;
  yearly_wage: number;
  components: SalaryComponent[];
  total_earnings: number;
  total_deductions: number;
  net_salary: number;
  pf_employee: number;
  pf_employer: number;
  professional_tax: number;
}

// ── Pagination ───────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
