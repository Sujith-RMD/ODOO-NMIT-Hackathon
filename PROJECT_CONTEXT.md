# Dayflow — Comprehensive Project Context & Technical Blueprint

> **Purpose of this document:**  
> This context file serves as the definitive reference guide for developers, AI assistants, and team members. It details the complete architecture, codebase structure, backend APIs, frontend component hierarchy, design system specifications, mock fallback engines, and current implementation status.

---

## 1. Executive Summary & Core Philosophy

**Dayflow** is a modern, enterprise-grade Human Resource Management System (HRMS) built for high responsiveness, quiet aesthetics, and seamless user experience.

- **Design Philosophy:** Clean, quiet, professional enterprise UI inspired by modern tools like Notion, Linear, and Odoo Internal Apps.  
  *(Strictly NO AI-slop: zero heavy gradients, zero glassmorphism/neumorphism, zero floating blobs, and zero arbitrary center-aligned layouts).*
- **Key Modules:** Employee Directory, Profile Management, Salary Structure & Real-time Live Calculations, Daily Attendance Tracking with Check-in/Out, and Time Off Request & Balance Management.
- **Architectural Flexibility:** Dual-mode service layer. The frontend automatically connects to the FastAPI backend at `http://localhost:8000/api` when available, and gracefully falls back to rich in-memory mock datasets when offline.

---

## 2. Technology Stack Overview

### Frontend Stack (`/frontend`)
- **Framework:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS v4 (configured via `@theme` tokens in `src/index.css`)
- **UI Primitives:** Custom shadcn/ui components powered by individual `@radix-ui/react-*` primitives (Avatar, Dialog, DropdownMenu, Label, Select, Separator, Slot, Tabs, Tooltip)
- **Icons:** `lucide-react`
- **State Management:** `zustand` (`authStore.ts` with `localStorage` persistence)
- **HTTP Client:** `axios` (with request interceptors for JWT bearer tokens and standard base URL configuration)
- **Routing:** `react-router-dom` v7

### Backend Stack (`/backend`)
- **Framework:** FastAPI (`python 3.10+`)
- **ASGI Server:** Uvicorn
- **ORM & Database:** SQLAlchemy 2.0 (configured for SQLite/PostgreSQL) with `alembic` migrations
- **Validation & Schemas:** Pydantic v2 & `pydantic-settings`
- **Authentication & Security:** JWT tokens (`python-jose`), password hashing (`passlib` with `bcrypt`)
- **Environment:** `python-dotenv`

---

## 3. Directory Structure

```
ODOO-NMIT-Hackathon/
├── PROJECT_CONTEXT.md              # <-- THIS DOCUMENT (Full Project Blueprint)
├── README.md
├── VAIBHAV_tasks.md               # Specific hackathon task sheet
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI entry point & CORS configuration
│   │   ├── config.py              # Environment variables & DB settings
│   │   ├── database.py            # SQLAlchemy engine & Base model definition
│   │   ├── models/                # SQLAlchemy Database Models
│   │   │   ├── user.py            # User authentication model
│   │   │   ├── employee.py        # Employee profile model
│   │   │   ├── attendance.py      # Attendance log & status model
│   │   │   ├── time_off.py        # Time-off types, allocations & requests
│   │   │   ├── salary.py          # Salary structures & component rules
│   │   │   ├── notification.py    # System notifications
│   │   │   └── document.py        # Employee documents
│   │   ├── routers/               # FastAPI API Route Handlers
│   │   │   ├── auth.py            # /api/auth (Login, Register, Refresh)
│   │   │   ├── employees.py       # /api/employees (CRUD, Search, Grid)
│   │   │   ├── profile.py         # /api/profile (Current User Profile)
│   │   │   ├── attendance.py     # /api/attendance (Check-in/out, logs, stats)
│   │   │   ├── time_off.py        # /api/time-off (Balances, requests, approvals)
│   │   │   ├── salary.py          # /api/salary (Structures, calculations)
│   │   │   └── notifications.py   # /api/notifications (User alerts)
│   │   ├── schemas/               # Pydantic Request/Response Models
│   │   ├── services/              # Backend Business Logic Services
│   │   └── utils/                 # Password hashing, JWT utils, helpers
│   ├── seed.py                    # Database Seeding Script
│   └── requirements.txt           # Python Dependencies
└── frontend/
    ├── index.html                 # Main HTML entry with Google Inter Font
    ├── vite.config.ts             # Vite configuration with Tailwind & `@/*` alias
    ├── tsconfig.app.json          # TypeScript config (verbatimModuleSyntax: false)
    ├── components.json            # shadcn/ui configuration
    ├── package.json               # NPM Dependencies & Scripts
    └── src/
        ├── main.tsx               # React root renderer
        ├── App.tsx                # Client-side router configuration
        ├── index.css              # Global styles, Tailwind `@theme` design tokens
        ├── types/
        │   └── index.ts           # TypeScript interfaces matching backend models
        ├── store/
        │   └── authStore.ts       # Zustand store for JWT & current user state
        ├── services/
        │   ├── api.ts             # Axios instance & token interceptor
        │   ├── authService.ts     # Auth API calls & mock auth fallback
        │   ├── employeeService.ts # Employee API calls & mock data
        │   ├── attendanceService.ts# Attendance check-in/out & history
        │   ├── timeOffService.ts  # Time-off requests & leave balances
        │   └── salaryService.ts   # Live salary engine & component breakdown
        ├── hooks/
        │   └── useSalaryCalculation.ts # Custom hook for live wage updates
        ├── utils/
        │   └── format.ts          # Currency, date, and hour formatters
        ├── components/
        │   ├── ui/                # Base shadcn primitives (Button, Card, Badge, Table, Tabs, etc.)
        │   ├── layout/            # AppShell, TopNav, AvatarMenu
        │   ├── employees/         # EmployeeGrid, EmployeeCard, EmployeeSearchBar, StatusDot
        │   ├── profile/           # ProfileHeader, ProfileTabs, ResumeTab, PrivateInfoTab, AboutTab, SecurityTab
        │   ├── attendance/        # CheckInOutControl (Check In/Out widget)
        │   └── salary/            # SalaryInfoTab, WageInput, SalaryComponentsTable, TaxDeductionsSection
        └── pages/
            ├── EmployeesPage.tsx   # Employee Directory with search & status filters
            ├── ProfilePage.tsx     # Full employee profile view with 5 tabs
            ├── AttendancePage.tsx  # Attendance metrics & detailed log table
            └── TimeOffPage.tsx     # Leave balances & time-off request list
```

---

## 4. Backend Database Schema & API Endpoint Specifications

### 4.1 Core Data Models

1. **User (`User`)**
   - `id`: Integer (PK)
   - `login_id`: String (Unique, e.g., `OIDO20240001`)
   - `email`: String (Unique)
   - `hashed_password`: String
   - `role`: Enum (`admin`, `employee`)
   - `is_active`: Boolean

2. **Employee (`Employee`)**
   - `id`: Integer (PK), `user_id`: Integer (FK -> User.id)
   - `first_name`, `last_name`, `email`, `phone`
   - `department`, `position`, `manager_id`, `location`
   - `date_of_joining`, `date_of_birth`, `gender`, `marital_status`
   - `bank_account_number`, `bank_name`, `ifsc_code`, `pan_number`, `uan_number`
   - `avatar_url`, `about`, `interests`, `skills`, `certifications`

3. **Attendance (`Attendance`)**
   - `id`: Integer (PK), `employee_id`: Integer (FK)
   - `date`: Date
   - `check_in`: Time / DateTime, `check_out`: Time / DateTime
   - `work_hours`: Float, `extra_hours`: Float
   - `status`: Enum (`present`, `absent`, `late`, `half_day`, `on_leave`)

4. **Time Off (`TimeOffType`, `TimeOffAllocation`, `TimeOffRequest`)**
   - `TimeOffType`: `id`, `name` (Paid Leave, Sick Leave, Unpaid), `is_paid`, `color`
   - `TimeOffAllocation`: `employee_id`, `time_off_type_id`, `allocated_days`, `used_days`, `available_days`
   - `TimeOffRequest`: `employee_id`, `time_off_type_id`, `start_date`, `end_date`, `total_days`, `reason`, `status` (`pending`, `approved`, `rejected`)

5. **Salary (`SalaryStructure`, `SalaryComponent`)**
   - `SalaryStructure`: `employee_id`, `monthly_wage`, `yearly_wage`, `working_days_per_month`
   - `SalaryComponent`: `salary_structure_id`, `name`, `component_type` (`earning`, `deduction`), `calculation_basis` (`percentage`, `fixed`), `percentage`, `fixed_amount`

---

### 4.2 API Endpoint Registry

| Module | HTTP Method | Endpoint | Description |
|---|---|---|---|
| **Auth** | `POST` | `/api/auth/login` | Authenticate user & return JWT token |
| **Auth** | `POST` | `/api/auth/register` | Register new user/company |
| **Auth** | `GET` | `/api/auth/me` | Return currently logged-in user profile |
| **Employees** | `GET` | `/api/employees` | List/search employee cards (paginated) |
| **Employees** | `GET` | `/api/employees/{id}` | Get detailed employee profile |
| **Employees** | `POST` | `/api/employees` | Create new employee (Admin) |
| **Attendance**| `GET` | `/api/attendance/my` | Current user's attendance log & summary stats |
| **Attendance**| `POST` | `/api/attendance/check-in` | Record check-in timestamp |
| **Attendance**| `POST` | `/api/attendance/check-out` | Record check-out timestamp & compute work hours |
| **Time Off** | `GET` | `/api/time-off/my-requests` | List user's leave requests |
| **Time Off** | `GET` | `/api/time-off/balances` | List user's available leave balances per type |
| **Time Off** | `POST` | `/api/time-off/request` | Submit new time-off request |
| **Salary** | `GET` | `/api/salary/employee/{id}`| Get salary structure & calculated components |
| **Salary** | `PUT` | `/api/salary/employee/{id}/wage`| Live calculation update based on new monthly wage |

---

## 5. Frontend Architecture & Page Flow

### 5.1 Route Tree & Page Components
- `/` → **`LoginPage`**: Authentication entry point.
- `/login` → Redirects to `/`.
- `/dashboard` → **`DashboardPage`**: Admin/employee dashboard (protected).
- `/employees` → **`EmployeesPage`**: Displays search bar, status counters, and responsive grid of `EmployeeCard` components (protected).
- `/employees/new` → **`AddEmployeePage`**: Multi-step employee creation wizard (protected, admin).
- `/employees/:id` → **`ProfilePage`**: Renders `ProfileHeader` (avatar, designation, status dot) + tabbed navigation (`ProfileTabs`) (protected).
- `/profile` → **`ProfilePage`**: Renders current user's profile view (protected).
- `/attendance` → **`AttendancePage`**: Stat cards (Present, Absent, Work Hours, Leave) + structured log table (protected).
- `/time-off` → **`TimeOffPage`**: Color-coded balance cards + request submission & history table (protected).
- `/salary` → **`SalaryPage`**: Employee-list sidebar + salary structure detail panel with live net pay calculation (protected, admin).
- `/notifications` → **`NotificationsPage`**: User notification feed (protected).
- `*` → Redirects to `/dashboard`.

*Authentication:* All routes except `/` and `/login` are wrapped in `RequireAuth`. The `AppShell` layout (with `TopNav`) renders as the parent route for all protected pages.

### 5.2 Top Navigation & Global Check-In/Out (`TopNav.tsx` & `CheckInOutControl.tsx`)
- The top header (`TopNav.tsx`) includes:
  - App Logo & Title ("Dayflow")
  - Navigation Links: `Employees`, `Attendance`, `Time Off`, and `Salary` (admin-only)
  - Real-time Check-In / Check-Out Widget (`CheckInOutControl.tsx`)
  - User Avatar & Quick Menu (`AvatarMenu.tsx`)

### 5.3 Live Frontend Salary Calculation Engine
To achieve instant feedback when adjusting employee wages (without lag), the frontend includes a client-side computation engine in `useSalaryCalculation.ts` and `salaryService.ts`:

**Earnings:**
- **Basic Salary:** 50% of Monthly Wage.
- **HRA (House Rent Allowance):** 50% of Basic.
- **Standard Allowance:** Fixed ₹4,167/month.
- **Performance Bonus:** 8.33% of Basic.
- **Leave Travel Allowance (LTA):** 8.33% of Basic.
- **Fixed Allowance:** Wage − sum of all other earning components (balancing remainder).

**Deductions:**
- **PF (Employee Contribution):** 12% of Basic (deducted from gross).
- **PF (Employer Contribution):** 12% of Basic (shown for info, not deducted from employee gross).
- **Professional Tax:** Flat ₹200/month.

---

## 6. Design System Guidelines & Color Tokens

All design tokens are defined in `frontend/src/index.css` via Tailwind CSS v4 `@theme`. Use semantic Tailwind classes — **never raw hex codes**:

```css
@theme {
  --color-background: #F7FAFC;
  --color-foreground: #1A1A1A;
  --color-card: #FFFFFF;
  --color-card-foreground: #1A1A1A;
  --color-primary: #2F80ED;           /* Dayflow Blue */
  --color-primary-foreground: #FFFFFF;
  --color-secondary: #F3F4F6;
  --color-muted-foreground: #6B7280;
  --color-destructive: #EB5757;
  --color-border: #E5E7EB;
  --color-input: #E5E7EB;
  --color-ring: #2F80ED;

  --color-status-present: #27AE60;    /* Green / Approved / Success */
  --color-status-absent: #F2C94C;     /* Yellow / Warning */
  --color-status-on-leave: #2F80ED;   /* Blue / On Leave */
  --color-status-pending: #94A3B8;    /* Slate / Neutral */
  --color-status-error: #EB5757;      /* Red / Rejected / Error */
  --color-status-late: #F97316;       /* Orange / Late */
  --color-status-half-day: #A855F7;   /* Purple / Half Day */

  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
}
```

### Visual Directives
- Standard font: **Inter** (loaded via HTML Google Fonts link).
- Border radii: Subtle `8px` (`rounded-lg`) for cards/tables; `full` for avatars and status dots.
- Typography scale: `.text-page-title` (22px semi-bold), `.text-section-label` (13px medium uppercase muted).

---

## 7. Current Project Status & Work Split

### 7.1 What's Already Built (Core Infrastructure & Features)
These pages and systems are completely finished:
- **Routing & Auth Guards:** `App.tsx`, `RequireAuth.tsx`, `api.ts` (JWT interceptors)
- **Employee Directory:** `EmployeesPage.tsx`
- **Employee Profile:** `ProfilePage.tsx` (all 5 tabs working)
- **Attendance:** `AttendancePage.tsx` (role-branched views, calendar, stats)
- **Time Off:** `TimeOffPage.tsx` (balances, approve/reject UI)
- **Request Time Off Modal:** Fully functional interactive leave calendar with validation, weekend exclusion logic, file attachments for sick leave, and full API integration (`POST /time-off/request`).
- **Salary & Payroll:** `SalaryPage.tsx` (employee list sidebar + salary structure detail panel, net pay calc, tax/PF, admin wage updates)
- **AI Features & Automations (Groq API):**
  - **Natural-Language Time Off Parser:** Located in `RequestTimeOffModal.tsx`. Users can type unstructured text (e.g., "I need next Wednesday off for a family trip"), and the `aiService` automatically extracts and prefills the calendar dates, leave type, and reason.
  - **Explain My Payslip:** Located in `SalaryInfoTab.tsx`. Provides a concise, plain-English breakdown of an employee's salary structure (Basic, HRA, PF, Tax, Net Pay) removing complex finance jargon.
- **Backend & Database:** Complete FastAPI implementation with SQLAlchemy engine configured for automatic SQLite fallback (`database.py`) if PostgreSQL is unavailable. Schemas fully synced and resolving all circular dependencies (`user.py`, `employee.py`, `auth.py`). Conflicting pip constraints resolved.
- **Mock Data Layer Verification:** `employeeService`, `attendanceService`, `timeOffService`, and `salaryService` operate gracefully offline using structured mock datasets.

*(All TanStack Query, Zustand store, and shadcn/ui setups are done)*

### 7.2 Pending Work (For Teammate / Fattah)
Stub files (skeletons) exist for all remaining pages with UI layout and extensive comments explaining backend endpoints and query patterns.

1. **Login Page (`src/pages/LoginPage.tsx`)**
   - **Task:** Integrate the login UI. Replace the dev bypass button with a real form that calls `POST /auth/login` and saves the token to `useAuthStore().login(token, user)`.
2. **Dashboard (`src/pages/DashboardPage.tsx`)**
   - **Task:** Wire up the data. Needs to show 4 stat cards (Total employees, present today, etc for admin; leave balances for employee). Use the `attendanceService` and `timeOffService` to fetch the data.
3. **Notifications (`src/pages/NotificationsPage.tsx`)**
   - **Task:** Wire it up to the real `/notifications/my` endpoint (you may need to create the service method in `api.ts`).
4. **Add Employee Form (`src/pages/AddEmployeePage.tsx`)**
   - **Task:** Build out the form fields using `react-hook-form` and submit to `POST /employees`. The generated `login_id` will be returned by the backend — show it on the final step.

---

## 8. Developer Quick-Start Guide

### How to test the app right now (Dev Bypass)
Run the dev server and click the **"Dev Login (bypass)"** button on the login page. It will log you in as an Admin using a mock token, allowing you to click around all the finished pages and see the stubs for the unfinished ones.

### How to Run Frontend locally:
```bash
cd frontend
npm install
npm run dev
```
Access at: `http://localhost:5173/`

### How to Run Backend locally:
```bash
cd backend
python -m venv venv
# Activate venv (Windows: venv\Scripts\activate | Unix: source venv/bin/activate)
pip install -r requirements.txt
python seed.py   # Seed mock database
uvicorn app.main:app --reload --port 8000
```
API Documentation available at: `http://localhost:8000/docs`

---

## 9. Actionable Guidance for AI Assistants / Future Collaborators

- **When adding new UI features:** Use shadcn primitives in `src/components/ui/`. Ensure no raw inline styles are used; rely on the centralized Tailwind tokens.
- **When creating new API calls:** Place requests inside the appropriate service file in `src/services/`. Always maintain the mock fallback data block inside the `.catch()` or offline condition so local development remains seamless.
- **When modifying types:** Update `src/types/index.ts` first, ensuring alignment with `backend/app/schemas/`.
