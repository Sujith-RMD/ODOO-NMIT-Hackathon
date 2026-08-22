import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { employeeService } from '../services/employeeService';
import { salaryService } from '../services/salaryService';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table';
import { Search, DollarSign } from 'lucide-react';
import { formatCurrency } from '../utils/format';

/**
 * ════════════════════════════════════════════════════════════════
 * SALARY / PAYROLL PAGE  —  Route: /salary
 * ════════════════════════════════════════════════════════════════
 *
 * OWNER: [YOU]
 * ACCESS: Admin only (RequireRole guard already applied in App.tsx)
 *
 * WHAT THIS PAGE SHOWS:
 *   A list of all employees with their current salary structure.
 *   Clicking an employee shows the full salary breakdown (earnings + deductions).
 *
 * TWO VIEWS:
 *   1. List view: table of employees → name, dept, monthly wage, net salary
 *   2. Detail view: click row → shows WageInput + SalaryComponentsTable + TaxDeductionsSection
 *      (These components already exist in src/components/salary/ — just import and use them!)
 *
 * BACKEND ENDPOINTS:
 *   GET  /employees                              → list of all employees (for the table)
 *   GET  /salary/{employee_id}/structure         → get salary structure for one employee
 *   POST /salary/{employee_id}/calculate         → calculate salary breakdown
 *                                                   Body: { monthly_wage: number }
 *   PUT  /salary/{employee_id}/structure         → update monthly_wage
 *                                                   Body: { monthly_wage: number }
 *
 * EXISTING COMPONENTS TO REUSE (already built!):
 *   import { WageInput }             from '../components/salary/WageInput';
 *   import { SalaryComponentsTable } from '../components/salary/SalaryComponentsTable';
 *   import { TaxDeductionsSection }  from '../components/salary/TaxDeductionsSection';
 *   import { useSalaryCalculation }  from '../hooks/useSalaryCalculation';
 *
 * PATTERN — the hook does all the work:
 *   const { structure, result, isLoading, isCalculating, updateWage }
 *     = useSalaryCalculation(selectedEmployeeId);
 *
 * QUERY PATTERN:
 *   const { data: employees } = useQuery({
 *     queryKey: ['employees'],
 *     queryFn: () => employeeService.getAll({}),
 *   });
 *
 * DESIGN:
 *   - Left panel: scrollable employee list (narrow, ~280px)
 *   - Right panel: salary detail for selected employee
 *   - Use same status colors as other pages
 * ════════════════════════════════════════════════════════════════
 */

export function SalaryPage() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['employees', { search }],
    queryFn: () => employeeService.getAll({ search }),
  });

  const employees = data?.items ?? [];

  return (
    <div className="w-full animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">Payroll</h1>
        <p className="text-sm text-muted-foreground">View and manage employee salary structures.</p>
      </div>

      <div className="flex gap-6 h-[calc(100vh-220px)]">
        {/* ── Left: Employee List ── */}
        <div className="w-72 shrink-0 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {isLoading
              ? [1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)
              : employees.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => setSelectedEmployeeId(emp.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                      selectedEmployeeId === emp.id
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-transparent hover:bg-secondary/80'
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground">{emp.full_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{emp.department ?? 'No dept'}</p>
                  </button>
                ))
            }
          </div>
        </div>

        {/* ── Right: Salary Detail ── */}
        <div className="flex-1 overflow-y-auto">
          {selectedEmployeeId == null ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-3">
              <DollarSign className="h-10 w-10 opacity-30" />
              <p className="text-sm">Select an employee to view salary details</p>
            </div>
          ) : (
            // TODO: Replace this placeholder with:
            // import { SalaryInfoTab } from '../components/salary/SalaryInfoTab';
            // const fakeEmployee = employees.find(e => e.id === selectedEmployeeId)!;
            // <SalaryInfoTab employee={fakeEmployee as any} />
            <div className="p-4 border rounded-lg bg-card text-center text-muted-foreground text-sm">
              {/* IMPLEMENT: Show WageInput + SalaryComponentsTable + TaxDeductionsSection */}
              <p>Salary detail for employee #{selectedEmployeeId}</p>
              <p className="text-xs mt-2 opacity-70">
                Use: <code>{'<SalaryInfoTab employee={...} />'}</code> from components/salary/
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
