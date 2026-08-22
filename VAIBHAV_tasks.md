# Vaibhav — Task Sheet (Dayflow/OdooHR Hackathon)

> Read this alongside Fattah's sheet once — the "Shared / coordinate" sections at the bottom of both must match. Everything else here is yours to build without checking in.

## 1. Your existing scope (from handoff.md — unchanged)

- `src/pages/SalaryPage.tsx` — employee-list sidebar + salary structure detail panel, net pay calc, tax/PF, admin wage updates
- `src/components/salary/*` — reused across this page and Profile's Salary tab

## 2. Fixes from the gap analysis — yours to fix

1. **Salary engine is missing components against the wireframe's own math.** At the moment `useSalaryCalculation.ts` / `salaryService.ts` only account for Basic, HRA, Standard Allowance, and a single PF line. Add:
   - **Performance Bonus** — 8.33% of Basic
   - **LTA** — 8.33% of Basic
   - **Fixed Allowance** — the balancing remainder (Wage − sum of every other component). Without this, components won't sum back to the full wage.
   - Confirm **Standard Allowance** is a **fixed ₹4,167/month**, not a percentage — the current write-up says "computed dynamically," which is ambiguous enough to have drifted from a flat amount.

2. **Split PF into two rows.** Wireframe wants **Employee contribution** and **Employer contribution**, each 12% of Basic, shown as separate line items — not one combined "12% deduction."

3. **Decide Professional Tax and make the docs match reality.** Wireframe: flat ₹200/month. Current code (per `PROJECT_CONTEXT.md` §5.3): tiered by income bracket. The tiered version is arguably more realistic, but it's scope beyond the original design — pick one (flat is faster to finish and matches the demo script; tiered is a nice-to-have if you have spare time) and update `PROJECT_CONTEXT.md` so it stops describing something that may not match what ships.

4. **Unify the design tokens — this is the highest-priority fix on either sheet.** `index.css` currently defines primary `#4F46E5` / status green `#22C55E` / amber `#EAB308` / blue `#0EA5E9`. `handoff.md`'s "Design Tokens" reminder tells Fattah to use a *different* palette entirely (`#2F80ED` primary, red/yellow/gray/blue statuses). If both of you build against different colors, the app will look visibly inconsistent between old and new pages — exactly the "looks unpolished" problem you're trying to avoid.
   - Pick one palette (recommend keeping `index.css` as the source of truth since it's already wired as real Tailwind theme tokens, not just a reminder doc)
   - Rewrite `handoff.md`'s token section to reference token *names* (`text-status-present`, `bg-primary`) instead of hardcoded hex
   - Add token colors for the two attendance states nobody's covered yet: `late` and `half_day`

5. **Add the `/salary` route and a nav entry.** Right now `SalaryPage.tsx` has no route in `App.tsx` and no link in `TopNav.tsx` — there's currently no way to reach it. Add both (admin-only nav link).

6. **Fix product naming.** "Dayflow" (handoff.md title), "DAYFLOW / OdooHR" (PROJECT_CONTEXT.md title), and "OdooHR" (actual `TopNav` text) are all different. Pick one final name and set it in `TopNav.tsx` since you're already touching that file for the nav link.

7. **Don't unilaterally resolve the Salary-tab-in-Profile question.** `ProfilePage.tsx`'s Salary Info tab is already marked "finished," and you're now building a full second Salary experience reusing the same components. Decide together with Fattah whether the Profile tab becomes a thin summary linking out to `/salary/:id`, or gets removed — then whoever it falls to makes the one edit, not both of you independently.

## 3. Files you own (no one else touches these)

- `src/pages/SalaryPage.tsx`
- `src/components/salary/*` (`SalaryInfoTab`, `WageInput`, `SalaryComponentsTable`, `TaxDeductionsSection`, `useSalaryCalculation.ts`)
- `src/index.css` (design tokens)
- `src/components/layout/TopNav.tsx` (nav links + branding)

## 4. Shared files — coordinate before editing, don't just push

- **`src/App.tsx`** (routes) — pull latest before adding `/salary`. Fattah is separately adding `/login`, `/dashboard`, `/notifications`, `/employees/new` — don't touch his lines.
- **Landing page decision** — Fattah's `DashboardPage` has no route yet; the wireframe says Employee Directory should be the landing page. Settle this together before either of you treats it as decided.
- **`ProfilePage.tsx` Salary tab** — see §2.7. Whoever ends up making this change, make it a single deliberate edit, not two people touching the tab logic separately.
- **Do not touch:** `LoginPage.tsx`, `DashboardPage.tsx`, `NotificationsPage.tsx`, `AddEmployeePage.tsx`, `RequestTimeOffModal.tsx`, or `PrivateInfoTab.tsx` — all Fattah's.

## 5. Suggested order

1. Unify design tokens in `index.css` (unblocks visual consistency for everything either of you builds from here)
2. Fill in the salary engine gaps (Bonus, LTA, Fixed Allowance, PF split)
3. Decide Professional Tax model, update the doc
4. Add `/salary` route + nav link + naming fix in `TopNav.tsx`
5. Sync with Fattah on the landing page and Profile-Salary-tab questions
