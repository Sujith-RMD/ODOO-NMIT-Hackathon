import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { attendanceService } from '../services/attendanceService';
import { timeOffService } from '../services/timeOffService';
import { employeeService } from '../services/employeeService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Users, Clock, CalendarOff, TrendingUp } from 'lucide-react';
import { formatDate } from '../utils/format';

/**
 * ════════════════════════════════════════════════════════════════
 * DASHBOARD PAGE  —  Route: /dashboard
 * ════════════════════════════════════════════════════════════════
 *
 * OWNER: [YOUR FRIEND]
 *
 * ROLE BRANCHING:
 *   Admin sees:  org-wide stats, recent leave requests, today's attendance summary
 *   Employee sees: personal stats (days present this month, leave balance, upcoming leaves)
 *
 * BACKEND ENDPOINTS TO USE:
 *   GET /attendance/my-summary?start_date=&end_date=    → employee stats
 *   GET /attendance/admin/all?start_date=&end_date=     → admin: today's org attendance
 *   GET /time-off/my-balances                           → employee leave balance
 *   GET /time-off/admin/requests?status=pending         → admin: pending requests count
 *   GET /employees?page_size=5                          → admin: recent employees (total count)
 *
 * QUERY PATTERN (use TanStack Query for every API call):
 *   const { data, isLoading } = useQuery({
 *     queryKey: ['dashboard-summary'],
 *     queryFn: () => attendanceService.getMySummary(startDate, endDate),
 *   });
 *
 * DESIGN NOTES:
 *   - Use <Card> from components/ui/card for stat blocks
 *   - Use spec colors: present=#27AE60, absent=#EB5757, pending=#94A3B8
 *   - Add a welcome message: "Good morning, {user.first_name}"
 *   - Keep it clean — 4 stat cards at top, then 2 columns below
 * ════════════════════════════════════════════════════════════════
 */

export function DashboardPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  // TODO: Replace skeleton with real data using useQuery (see comments above)
  return (
    <div className="w-full animate-in fade-in duration-300">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin ? "Organization overview" : "Your personal overview"}
        </p>
      </div>

      {/* ── STAT CARDS (4 across) ── */}
      {/* TODO: wire real data from APIs listed above */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: isAdmin ? 'Total Employees' : 'Days Present',     icon: Users,      color: '#2F80ED' },
          { label: isAdmin ? 'Present Today'   : 'Leave Balance',    icon: Clock,      color: '#27AE60' },
          { label: isAdmin ? 'On Leave Today'  : 'Pending Requests', icon: CalendarOff,color: '#F2C94C' },
          { label: isAdmin ? 'Pending Leaves'  : 'Work Hours',       icon: TrendingUp, color: '#94A3B8' },
        ].map(({ label, icon: Icon, color }) => (
          <Card key={label} className="border shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${color}15` }}>
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
                {/* Replace Skeleton with real value */}
                <Skeleton className="h-7 w-16 mt-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── CONTENT AREA (2 columns) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent attendance / Today's check-in status */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              {isAdmin ? "Today's Attendance" : "This Month"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* TODO: render attendance data */}
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full rounded-md" />)}
            </div>
          </CardContent>
        </Card>

        {/* Right: Leave requests / Balances */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              {isAdmin ? "Pending Leave Requests" : "Leave Balances"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* TODO: render leave data */}
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full rounded-md" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
