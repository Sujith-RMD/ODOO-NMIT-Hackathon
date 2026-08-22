# HRMS Frontend — Build Spec (Odoo Hackathon)

> This document was reverse-engineered from an Excalidraw wireframe file (`Human_Resource_Management_System_-_8_hours.excalidraw`) containing 574 elements across 4 screen-groups. It separates **actual UI content** (what should render) from **design/functional annotations** (notes the original designer left for the builder — these should NOT appear as literal on-screen text). Read this whole file before writing any code.

## 0. Context & Constraints

- Odoo hackathon project, ~8-hour build window (per the file name). This is the **frontend only** — assume a backend/API exists or will be mocked. Ask the user whether to stub data locally (recommended for hackathon speed) or wire to a real API.
- Stack signal from the developer: React + TypeScript + Tailwind is the natural fit (their existing stack). Recommend **shadcn/ui + Tailwind + lucide-react** as the component/icon foundation — it gives real, restrained primitives instead of reinventing tables/tabs/dialogs under time pressure, and it's easy to re-skin so it doesn't look like a shadcn demo.
- Priority order for an 8-hour hackathon: (1) Employee Directory + Profile, (2) Attendance, (3) Time Off, (4) Auth screens. Directory + Profile is what judges will spend the most time looking at — polish that first.

## 1. Design Direction — read this before building anything

The developer explicitly does not want this to look like generic AI-generated UI. Concretely, that means avoiding:

- Purple-to-blue gradient buttons/backgrounds, glassmorphism, neumorphism, or "glowing" cards.
- Every corner rounded to a pill/blob (`rounded-full` on rectangular content, `rounded-3xl` on small buttons).
- Emoji used as UI icons (the wireframe uses 🟢/✈️/🟡 as *placeholder shorthand* for status — render these as actual small SVG icon/dot components, never literal emoji).
- Center-aligned everything, oversized hero-style headings on internal app screens, drop-shadow-on-everything.
- Mixed decorative fonts. Inconsistent icon sets (mixing outline and filled icons from different packs).
- Placeholder-y feeling empty states, no loading/skeleton states, no hover/focus states.

Instead, build toward a **quiet, professional HR-tool aesthetic** — think the actual Odoo, Linear, or Notion's internal tooling, not a marketing landing page:

**Color**
- Neutral base: near-white background (`#FAFAFA` / `#F7F7F8`), near-black text (`#1A1A1A`), not pure `#000`/`#FFF`.
- One brand/accent color used sparingly — for primary buttons, active tab, active nav item, links. Suggest a deep indigo or teal (e.g. `#4F46E5` or `#0F766E`) rather than the overused purple-blue AI gradient.
- Status colors follow real semantics, used as small solid dots/badges, not big colored blocks: green (`#22C55E` present), amber/yellow (`#EAB308` absent), sky/blue (`#0EA5E9` or a plane icon, on leave), red (`#EF4444` reserved for destructive/reject actions only).
- Borders: a single light neutral (`#E5E7EB`)-style border, 1px, used consistently instead of shadows to separate content.

**Typography**
- One font family (Inter, or a similar grotesk system font) with 2–3 weights (regular/medium/semibold). No decorative fonts.
- Real hierarchy: page title ~20–24px semibold, section labels ~13px medium uppercase-tracked or just bold 14px, body ~14px regular, table text ~13–14px, helper/muted text ~12–13px in a muted gray (`#6B7280`).

**Spacing & shape**
- 4/8px spacing scale throughout (Tailwind default scale is fine — just be consistent).
- Border radius: 6–8px on cards/inputs/buttons. Avatars are the exception (circular). Don't round everything the same amount.
- Cards: white background, 1px border, no heavy shadow — at most a very subtle `shadow-sm`.

**Tables & data density**
- Real table components (sticky header row, right-aligned numeric columns, zebra-free — use border-bottom row dividers instead), not cards pretending to be table rows.
- Truncate long text with ellipsis + title tooltip rather than wrapping and breaking row height.

**Icons**
- One icon set only (lucide-react). Consistent stroke width and size (16 or 20px) per context.

**Motion**
- Subtle only: 150–200ms ease transitions on hover/focus/tab-switch/modal-open. No bouncy spring animations, no page-load fade-in choreography.

If using shadcn/ui: override the default theme tokens (don't ship the default zinc/slate shadcn look untouched) — set the CSS variables for background, foreground, primary, border, and radius to match the palette above so it doesn't read as an un-styled shadcn scaffold.

---

## 2. Global Layout (appears on every authenticated screen)

**Top navigation bar** — present on Directory, Profile, Attendance, and Time Off screens identically:
- Left: Company Logo (placeholder logo mark + wordmark)
- Center/left nav links: **Employees**, **Attendance**, **Time Off** (highlight the active section)
- Right: Check In/Check Out control (see §5) + user avatar

**Avatar dropdown** (click the profile picture in the top-right):
- Opens a dropdown menu with two options: **My Profile**, **Log Out**
- The avatar itself carries a small presence-status dot bound to attendance state.

---

## 3. Screen: Sign In

Fields:
- Login ID / Email
- Password
- Primary button: **Sign In**
- Secondary link: "Don't have an account? Sign Up"

## 4. Screen: Sign Up (company/admin onboarding — not for regular employees)

This is a **first-admin / company creation** flow, not a general employee self-registration form (see functional note below).

Fields:
- Upload Logo
- Company Name
- Name
- Email
- Password
- Confirm Password
- Phone
- Primary button: **Sign Up**
- Secondary link: "Already have an account? Sign In"

**Functional note (do not render as UI copy):** Regular employees never self-register. When an HR officer/Admin creates a new employee record, the system auto-generates that employee's Login ID in the format:

```
[OI][first 2 letters of first name + first 2 letters of last name][year of joining][serial number for that year]
Example: OIJODO20220001
  OI    → Odoo India (company)
  JODO  → first two letters of first + last name
  2022  → year of joining
  0001  → serial number of joining that year
```

The system also auto-generates that user's first password; the user changes it after first login. **Build implication:** the "Add Employee" flow (from the Directory screen's NEW button) should show a preview/read-only Login ID field generated from Name + Join Date, not an editable field, and should not ask the new employee to set a password.

---

## 5. Screen: Employee Directory (Admin/HR landing page)

**This is the page the user lands on immediately after login** — not the sign-in page, not a generic dashboard. Build this as the default authenticated route.

Layout: grid of employee cards, with a **search bar** and a **NEW** button (add employee — admin only) above the grid.

Each card shows:
- Employee profile picture (avatar)
- Employee Name
- A status indicator in the top-right corner of the card:
  - 🟢 solid green dot → present in office today
  - ✈️ plane icon → on approved leave today
  - 🟡 solid yellow/amber dot → absent (no check-in, no time-off request filed)

**Interaction:** Cards are clickable. Clicking a card opens that employee's profile in **view-only / non-editable mode** (i.e., the same Profile layout as §6, but for Admin viewing someone else — all fields read-only, no edit affordances shown unless the viewer is Admin *and* explicitly enters an edit mode you can decide is out of scope for the hackathon).

---

## 6. Screen: Employee Profile ("My Profile")

Opens in **form view**. This is what a logged-in employee sees when they click their own "My Profile", and what Admin sees (read-only) when clicking a directory card.

**Header block:**
- Large avatar
- Name (large/prominent)
- Company name (secondary, smaller, under the name)
- Login ID
- Email
- Mobile

**Left-hand vertical tab list**, tabs in this order:
1. **Resume**
2. **Private Info**
3. **Salary Info** — visible to Admin only; hidden entirely for a regular employee viewing their own profile (per explicit annotation: "Salary Info tab should only be visible to Admin")
4. **About**
5. **Security**

### 6a. Private Info tab — fields
- Job Position
- Department
- Manager
- Location
- Residing Address
- Date of Birth
- Nationality
- Gender
- Personal Email
- Marital Status
- Date of Joining
- **Bank Details** section: Account Number, Bank Name, IFSC Code, UAN No, PAN No, Emp Code

### 6b. About tab — fields
- About (free text — wireframe uses lorem-ipsum-style placeholder; treat as a text/bio field)
- Skills (tag list) + "+ Add Skills" action
- Certification
- What I love about my job (free text)
- My interests and hobbies (free text)

### 6c. Salary Info tab (Admin-only)
Purpose: define and manage everything salary-related for the employee. Salary components must **auto-calculate** off a single Wage input — this is the most functionally complex screen in the whole app; treat it as a real calculation engine, not static mock data.

Top controls:
- **Wage** input, with a Month/Yearly toggle (Month Wage vs Yearly wage — Yearly = Month × 12; wireframe example: 50,000/month = 600,000/year)
- No. of working days in a week
- Break Time
- An hourly-rate readout (`/hrs`)

**Salary Components table** — each row: Component name, description text (helper copy explaining what it is), Amount (₹/month), Percentage, Computation Type (Fixed Amount or % of Wage). Rows, with the wireframe's example computation logic at Wage = ₹50,000:

| Component | Basis | Example @ ₹50,000 wage |
|---|---|---|
| Basic Salary | 50% of Wage (fixed % of wage) | ₹25,000.00 / 50% |
| House Rent Allowance (HRA) | 50% of Basic | ₹12,500.00 / 50% |
| Standard Allowance | fixed ₹4,167 (helper text: "a predetermined, fixed amount") | ₹4,167.00 / 16.67% |
| Performance Bonus | 8.33% of Basic (variable, company-defined) | ₹2,082.50 / 8.33% |
| Leave Travel Allowance (LTA) | 8.333% of Basic | ₹2,082.50 / 8.33% |
| Fixed Allowance | remainder: Wage − sum of all other components | ₹2,918.00 / 11.67% |

**Rule:** components must recompute live when Wage changes, and the sum of all components must never exceed the defined Wage (Fixed Allowance is the balancing figure).

**Tax Deductions section:**
- **Provident Fund (PF) Contribution** — shown as two rows: Employee contribution and Employer contribution, each 12% of Basic Salary, with amount + % + helper text ("PF is calculated based on the basic salary")
- **Professional Tax** — fixed ₹200/month, helper text ("Professional Tax deducted from the Gross salary")

Build this tab with clear per-row structure: label · helper/description text (smaller, muted) · amount · percentage, so it reads like a real payroll breakdown rather than a random field list.

---

## 7. Attendance

### 7a. Check In / Check Out control (lives in the top nav, always visible)
- Button/control reads **"Check In →"** before check-in.
- A status dot next to the user's avatar starts **red**.
- On successful check-in: dot turns **green**, and a small "Since HH:MM" timestamp appears next to it.
- Button then reads **"Check Out →"** to end the day.

### 7b. Attendance List view
Two distinct views depending on role — build as one component with a role-based branch, not two disconnected pages.

**Admin / HR Officer view:**
- Date navigation: `←  [Date ▾]  →` plus a "Day" label — lets Admin step through single days.
- Table columns: **Emp**, **Check In**, **Check Out**, **Work Hours**, **Extra hours** — one row per employee for the selected day.
- Default: shows all employees present on the current day.

**Employee (self) view:**
- Month navigation: `←  [Oct ▾]  →`
- Three summary stat cards above the table: **Count of days present**, **Leaves count**, **Total working days**
- Table columns: **Date**, **Check In**, **Check Out**, **Work Hours**, **Extra hours** — one row per day of the selected month, for the logged-in employee only.
- Default view on load: current ongoing month, day-wise, for self.

**Functional notes (backend logic, not UI copy):**
- Attendance data is the source of truth for payslip generation — total payable days per employee derive from it.
- Any unpaid leave or missing attendance day automatically reduces payable days in payslip computation. (Out of scope to build payslips in the hackathon, but keep attendance data shaped so it *could* feed that.)

---

## 8. Time Off

Two views again, same pattern as Attendance — one component, role-branched.

**Employee (self) view:**
- Two balance summary cards: **Paid Time Off** (e.g. "24 Days Available") and **Sick time off** (e.g. "07 Days Available")
- **NEW** button → opens the Time Off Request modal (§9)
- Table of the employee's own requests — columns: **Name**, **Start Date**, **End Date**, **Time off Type**, **Status**
- Search bar

**Admin / HR Officer view:**
- Same table shape but shows every employee's requests, plus **Approve** and **Reject** action buttons per pending row.
- Search bar
- Functional note: employees can only ever see and manage their own time-off records; Admin/HR can see and approve/reject for everyone.

## 9. Modal: Time Off Type Request

Triggered by the **NEW** button on the employee Time Off view. Standard dialog with a close (×) affordance.

Fields:
- **Employee** — auto-filled/read-only (the logged-in user)
- **Time Off Type** — dropdown: `Paid Time Off`, `Sick Leave`, `Unpaid Leaves`
- **Validity Period** — date range: From – To
- **Allocation** — number of days (e.g. `01.00`, unit label "Days")
- **Attachment** — file upload, conditionally relevant/required when Time Off Type = Sick Leave (helper text: "For sick leave certificate")

Actions: **Submit** (primary), **Discard** (secondary/ghost)

---

## 10. Folder Structure & Route Map

The project's actual folder structure (already scaffolded) is correct and doesn't need restructuring — it's a standard, sensible feature-folder layout for a project this size. Here's how the spec above maps onto it, so nothing ends up in the wrong place:

```
frontend/src/
├── components/
│   ├── attendance/        → CheckInOutControl (nav widget, §7a), AttendanceListAdmin,
│   │                         AttendanceListSelf, AttendanceStatCards (§7b)
│   ├── employees/         → EmployeeCard, EmployeeGrid, EmployeeSearchBar, StatusDot (§5)
│   ├── layout/            → AppShell (top nav + avatar dropdown, §2), TopNav, AvatarMenu
│   ├── profile/           → ProfileHeader, ProfileTabs, ResumeTab, PrivateInfoTab,
│   │                         AboutTab, SecurityTab (§6, §6a, §6b) — NOT salary, see below
│   ├── salary/            → SalaryInfoTab, WageInput, SalaryComponentsTable,
│   │                         TaxDeductionsSection, useSalaryCalculation (§6c)
│   ├── time-off/          → TimeOffBalanceCards, TimeOffTableAdmin, TimeOffTableSelf,
│   │                         TimeOffRequestModal (§8, §9)
│   └── ui/                → shadcn primitives (button, table, tabs, dialog, dropdown-menu,
│                             input, badge, avatar) re-themed per §1 — nothing app-specific lives here
├── pages/
│   ├── SignInPage.tsx / SignUpPage.tsx        (§3, §4 — simple enough not to need their own
│   │                                            components/ subfolder; compose inline or from ui/)
│   ├── EmployeesPage.tsx        → route "/employees", renders components/employees/*
│   ├── ProfilePage.tsx          → routes "/profile" and "/employees/:id", composes
│   │                               components/profile/* and components/salary/* (role-gated)
│   ├── AttendancePage.tsx       → route "/attendance", role-branches inside
│   └── TimeOffPage.tsx          → route "/time-off", role-branches inside
├── hooks/                  → useAuth, useCurrentUser, useSalaryCalculation (or keep salary-specific
│                              hook inside components/salary/ if it's not reused elsewhere)
├── services/               → api client calls (or mock data functions) per domain: employeeService,
│                              attendanceService, timeOffService, authService
├── store/                  → auth/session state, current-user role (drives the Admin vs Employee
│                              branching used throughout Attendance, Time Off, and Salary visibility)
├── types/                  → the TypeScript shapes in §11 (Employee, AttendanceRecord,
│                              TimeOffBalance, TimeOffRequest)
├── lib/                    → utils.ts (shadcn's cn() helper), salary calculation formulas if you
│                              want them pure/testable and separate from the hook
└── utils/                  → generic helpers (date formatting, currency formatting for ₹)
```

**Routes:**
```
/sign-in
/sign-up                      (first-admin / company creation)
/                              → redirects to /employees after auth (landing page)
/employees                    → EmployeesPage (§5)
/employees/:id                → ProfilePage, view-only for non-self (§6)
/profile                      → ProfilePage, own profile (§6)
/attendance                   → AttendancePage, role-branched (§7b)
/time-off                     → TimeOffPage, role-branched (§8) + Request modal (§9)
```

**One note on the split:** Salary Info is a *tab inside the Profile page* (§6), but it's complex enough (live calculation, Admin-only visibility, PF/tax logic) that giving it its own `components/salary/` folder — as already scaffolded — is the right call rather than burying it inside `components/profile/`. `ProfilePage` just conditionally renders the salary tab's content from `components/salary/` alongside the other tabs from `components/profile/`.

## 11. Data shape hints (for mocking)

```ts
type Employee = {
  id: string;
  loginId: string;          // e.g. "OIJODO20220001"
  name: string;
  email: string;
  personalEmail?: string;
  mobile: string;
  avatarUrl?: string;
  jobPosition: string;
  department: string;
  managerId?: string;
  location: string;
  dateOfJoining: string;
  dateOfBirth: string;
  nationality: string;
  gender: string;
  maritalStatus: string;
  residingAddress: string;
  bank: { accountNumber: string; bankName: string; ifsc: string; uan: string; pan: string; empCode: string };
  about?: string; skills: string[]; certification?: string;
  whatILoveAboutMyJob?: string; interests?: string;
  wageMonthly: number;      // basis for all salary component math
  workingDaysPerWeek: number;
  todayStatus: "present" | "on_leave" | "absent";
};

type AttendanceRecord = { employeeId: string; date: string; checkIn?: string; checkOut?: string; workHours?: string; extraHours?: string };

type TimeOffBalance = { employeeId: string; paidDaysAvailable: number; sickDaysAvailable: number };
type TimeOffRequest = { id: string; employeeId: string; type: "Paid Time Off" | "Sick Leave" | "Unpaid Leaves"; startDate: string; endDate: string; allocationDays: number; attachmentUrl?: string; status: "Pending" | "Approved" | "Rejected" };
```

Salary components should be **derived**, not stored raw — compute Basic/HRA/Standard/Bonus/LTA/Fixed/PF/PT from `wageMonthly` using the formulas in §6c so the "auto-update on wage change" requirement is real, not faked.

---

## 12. What to ask the developer before/while building (don't guess silently)

- Real API or fully mocked data for the hackathon demo?
- Should Admin be able to *edit* a viewed employee's profile, or is view-only sufficient for the demo (wireframe only specifies view-only on card click)?
- Any existing brand color/logo for "the company" to seed the palette, or use the neutral+one-accent direction above?
