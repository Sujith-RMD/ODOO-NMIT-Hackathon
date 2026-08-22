# DAYFLOW / OdooHR — Comprehensive Project Context & Technical Blueprint

> **Purpose of this document:**  
> This context file serves as the definitive reference guide for developers, AI assistants, and team members. It details the complete architecture, codebase structure, backend APIs, frontend component hierarchy, design system specifications, mock fallback engines, and current implementation status.

---

## 1. Executive Summary & Core Philosophy

**DAYFLOW / OdooHR** is a modern, enterprise-grade Human Resource Management System (HRMS) built for high responsiveness, quiet aesthetics, and seamless user experience.

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
- `/` -> Redirects automatically to `/employees`
- `/employees` -> **`EmployeesPage`**: Displays search bar, status counters, and responsive grid of `EmployeeCard` components.
- `/employees/:id` -> **`ProfilePage`**: Renders `ProfileHeader` (avatar, designation, status dot) + tabbed navigation (`ProfileTabs`).
- `/profile` -> **`ProfilePage`**: Renders current user's profile view.
- `/attendance` -> **`AttendancePage`**: Stat cards (Present, Absent, Work Hours, Leave) + structured log table.
- `/time-off` -> **`TimeOffPage`**: Color-coded balance cards + request submission & history table.

*Note on Authentication Pages:* The `SignInPage` and `SignUpPage` files were removed from our branch per team domain separation (another team member is owning auth page UI). `AppShell.tsx` currently bypasses unauthenticated redirects to enable seamless local development of internal pages.

### 5.2 Top Navigation & Global Check-In/Out (`TopNav.tsx` & `CheckInOutControl.tsx`)
- The top header (`TopNav.tsx`) includes:
  - App Logo & Title ("OdooHR")
  - Navigation Links (`Employees`, `Attendance`, `Time Off`)
  - Real-time Check-In / Check-Out Widget (`CheckInOutControl.tsx`)
  - User Avatar & Quick Menu (`AvatarMenu.tsx`)

### 5.3 Live Frontend Salary Calculation Engine
To achieve instant feedback when adjusting employee wages (without lag), the frontend includes a client-side computation engine in `useSalaryCalculation.ts` and `salaryService.ts`:
- **Basic Pay Calculation:** Computed as a percentage of Monthly Wage (default 50%).
- **HRA (House Rent Allowance):** Computed as a percentage of Basic Pay (default 50% of Basic).
- **Standard Allowances:** Computed dynamically.
- **PF (Provident Fund):** 12% deduction on Basic Pay.
- **Professional Tax:** Dynamic tiered deduction based on income brackets.

---

## 6. Design System Guidelines & Color Tokens

All design tokens are defined in `frontend/src/index.css` via Tailwind CSS v4 `@theme`:

```css
@theme {
  --color-background: #FAFAFA;
  --color-foreground: #1A1A1A;
  --color-card: #FFFFFF;
  --color-card-foreground: #1A1A1A;
  --color-primary: #4F46E5;       /* Deep Indigo - Primary Accent */
  --color-primary-foreground: #FFFFFF;
  --color-secondary: #F3F4F6;
  --color-muted-foreground: #6B7280;
  --color-border: #E5E7EB;
  --color-input: #E5E7EB;
  --color-ring: #4F46E5;

  --color-status-present: #22C55E;  /* Green dot */
  --color-status-absent: #EAB308;   /* Amber dot */
  --color-status-on-leave: #0EA5E9; /* Blue dot */

  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
}
```

### Visual Directives
- Standard font: **Inter** (loaded via HTML Google Fonts link).
- Border radii: Subtle `8px` (`rounded-lg`) for cards/tables; `full` for avatars and status dots.
- Typography scale: `.text-page-title` (22px semi-bold), `.text-section-label` (13px medium uppercase muted).

---

## 7. Current Project Status & Recent Work Done

1. **Fixed UI Primitive Imports:**  
   Replaced all generic `radix-ui` barrel imports in `src/components/ui/` with direct `@radix-ui/react-*` primitives to resolve Vite bundler resolution errors.
2. **TSConfig & CSS Normalization:**  
   Set `verbatimModuleSyntax: false` in `tsconfig.app.json` to allow clean TypeScript type imports across service files. Moved Google Fonts `@import` to `index.html` to adhere to CSS spec rules.
3. **Mock Data Layer Verification:**  
   Verified that `employeeService`, `attendanceService`, `timeOffService`, and `salaryService` operate gracefully offline using structured mock datasets.
4. **Git Repository Synchronization:**  
   Resolved merge/rebase conflicts with remote branch updates and verified all files are synced on `main`.

---

## 8. Developer Quick-Start Guide

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
