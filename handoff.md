# Dayflow Frontend — Work Split & Handoff

> **Last updated:** 22 Aug 2026  
> **Dev server:** `cd frontend && npm run dev` → http://localhost:5173  
> **Backend:** `cd backend && uvicorn app.main:app --reload` → http://localhost:8000  
> **API proxy:** Vite proxies `/api/*` → `http://localhost:8000` (configured in `vite.config.ts`)

---

## ✅ What's Already Built (Core Infrastructure)

These pages and systems are completely finished. You do not need to touch them:
- **Routing & Auth Guards:** `App.tsx`, `RequireAuth.tsx`, `api.ts` (JWT interceptors)
- **Employee Directory:** `EmployeesPage.tsx`
- **Employee Profile:** `ProfilePage.tsx` (all 5 tabs working)
- **Attendance:** `AttendancePage.tsx` (role-branched views, calendar, stats)
- **Time Off:** `TimeOffPage.tsx` (balances, approve/reject UI)

*(All TanStack Query, Zustand store, and shadcn/ui setups are done)*

---

## 🛠️ Work Split: Who Does What Next?

I have created **stub files** (skeletons) for all the remaining pages in the system. They have the UI layout and extensive comments at the top explaining exactly what backend endpoints and query patterns to use.

### 👤 For Your Teammate (Friend) to build:

#### 1. Login Page (`src/pages/LoginPage.tsx`)
- **Status:** Stub created with a temporary "Dev Bypass" button for testing.
- **Task:** Integrate the login UI they built on their branch. Replace the dev bypass button with a real form that calls `POST /auth/login` and saves the token to `useAuthStore().login(token, user)`.

#### 2. Dashboard (`src/pages/DashboardPage.tsx`)
- **Status:** Stub created with a skeleton layout.
- **Task:** Wire up the data. Needs to show 4 stat cards (Total employees, present today, etc for admin; leave balances for employee). Use the `attendanceService` and `timeOffService` to fetch the data.

#### 3. Notifications (`src/pages/NotificationsPage.tsx`)
- **Status:** Stub created with mock data and the mutation skeleton.
- **Task:** Wire it up to the real `/notifications/my` endpoint (you may need to create the service method in `api.ts`).

#### 4. Add Employee Form (`src/pages/AddEmployeePage.tsx`)
- **Status:** Stub created with a 4-step wizard UI skeleton.
- **Task:** Build out the form fields using `react-hook-form` and submit to `POST /employees`. The generated `login_id` will be returned by the backend — show it on the final step.

#### 5. Request Time Off Modal (`src/components/time-off/RequestTimeOffModal.tsx`)
- **Status:** Stub created, already wired into the `TimeOffPage` button.
- **Task:** Make the form actually submit the request using `POST /time-off/my-requests`.

---

### 🤖 For Me (AI) to build:

#### 1. Salary & Payroll Page (`src/pages/SalaryPage.tsx`)
- **Status:** Stub created with employee list sidebar.
- **My Task:** I will build out the complex right-hand panel that shows the salary structure, calculates net pay, handles taxes/PF, and allows admins to update the base wage. I will reuse the components I already built in `src/components/salary/`.

---

## 🎨 Design Tokens (Reminder)

All tokens are defined as CSS variables in `src/index.css` via `@theme`. Use semantic Tailwind classes — **never raw hex codes**:

- `text-primary` / `bg-primary` → Dayflow Blue
- `text-status-present` / `bg-status-present` → Present / Approved / Success
- `text-status-error` / `bg-status-error` → Rejected / Error
- `text-status-absent` / `bg-status-absent` → Absent / Warning
- `text-status-late` / `bg-status-late` → Late
- `text-status-half-day` / `bg-status-half-day` → Half Day
- `text-status-pending` / `bg-status-pending` → Pending / Neutral
- `text-status-on-leave` / `bg-status-on-leave` → On Leave

---

## 🚀 How to test right now
Run the dev server and click the **"Dev Login (bypass)"** button on the login page. It will log you in as an Admin using a mock token, allowing you to click around all the finished pages and see the stubs for the unfinished ones.
