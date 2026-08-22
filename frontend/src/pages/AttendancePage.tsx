import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '../services/attendanceService';
import { useAuthStore } from '../store/authStore';
import { AttendanceRecord, AttendanceSummary } from '../types';
import { CheckInOutControl } from '../components/attendance/CheckInOutControl';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { formatWorkHours, formatDate } from '../utils/format';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import {
  Clock, Calendar, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  AlertCircle, Timer
} from 'lucide-react';

// ── helpers ───────────────────────────────────────────────────────────

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0); // last day of month
  return { start: toDateString(start), end: toDateString(end) };
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    present:  { label: 'Present',  className: 'text-[#27AE60] bg-[#27AE60]/10 border-[#27AE60]/30' },
    absent:   { label: 'Absent',   className: 'text-[#EB5757] bg-[#EB5757]/10 border-[#EB5757]/30' },
    late:     { label: 'Late',     className: 'text-[#F2C94C] bg-[#F2C94C]/10 border-amber-200' },
    half_day: { label: 'Half Day', className: 'text-orange-600 bg-orange-50 border-orange-200' },
    on_leave: { label: 'On Leave', className: 'text-[#2F80ED] bg-[#2F80ED]/10 border-[#2F80ED]/30' },
  };
  const cfg = map[status] ?? { label: status, className: '' };
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}

function SummaryCards({ summary, isLoading }: { summary?: AttendanceSummary; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }
  if (!summary) return null;

  const cards = [
    { label: 'Present Days',     value: `${summary.present_days} / ${summary.total_working_days}`, icon: CheckCircle2, color: '#27AE60' },
    { label: 'Absent Days',      value: summary.absent_days,        icon: XCircle,      color: '#EB5757' },
    { label: 'Total Work Hours', value: `${summary.total_work_hours}h`, icon: Clock,    color: '#2F80ED' },
    { label: 'On Leave',         value: summary.on_leave_days,      icon: Calendar,     color: '#94A3B8' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <Card key={label} className="border shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${color}15` }}>
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Employee View ─────────────────────────────────────────────────────

function EmployeeAttendanceView() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const { start, end } = getMonthRange(year, month);

  const { data: records = [], isLoading: recordsLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', 'my-history', start, end],
    queryFn: () => attendanceService.getMyHistory(start, end),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['attendance', 'my-summary', start, end],
    queryFn: () => attendanceService.getMySummary(start, end),
  });

  const goToPrevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const goToNextMonth = () => {
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
    if (isCurrentMonth) return; // can't go to future
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  return (
    <>
      <SummaryCards summary={summary} isLoading={summaryLoading} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-semibold">Attendance Log</CardTitle>
          {/* Month navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevMonth}
              className="p-1.5 rounded-md hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <span className="text-sm font-medium w-32 text-center">
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              onClick={goToNextMonth}
              disabled={isCurrentMonth}
              className="p-1.5 rounded-md hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recordsLoading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Work Hours</TableHead>
                    <TableHead className="text-right">Extra</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{formatDate(record.date)}</TableCell>
                      <TableCell className="tabular-nums">
                        {record.check_in ? record.check_in.slice(0, 5) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {record.check_out ? record.check_out.slice(0, 5) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell><StatusBadge status={record.status} /></TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {record.work_hours > 0 ? formatWorkHours(record.work_hours) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {record.extra_hours > 0 ? `+${record.extra_hours}h` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {records.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        No attendance records for {MONTH_NAMES[month]} {year}.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ── Admin View ────────────────────────────────────────────────────────

function AdminAttendanceView() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(toDateString(today));
  const [statusFilter, setStatusFilter] = useState('');

  const { data: records = [], isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', 'admin', selectedDate, statusFilter],
    queryFn: () => attendanceService.getAdminAll({
      start_date: selectedDate,
      end_date: selectedDate,
      ...(statusFilter ? { status: statusFilter } : {}),
    }),
  });

  const goToPrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(toDateString(d));
  };

  const goToNextDay = () => {
    const d = new Date(selectedDate);
    const nextDay = new Date(d);
    nextDay.setDate(d.getDate() + 1);
    if (nextDay > today) return;
    setSelectedDate(toDateString(nextDay));
  };

  const isToday = selectedDate === toDateString(today);

  // Quick summary from the fetched records
  const quickStats = {
    present:  records.filter(r => r.status === 'present').length,
    absent:   records.filter(r => r.status === 'absent').length,
    late:     records.filter(r => r.status === 'late').length,
    on_leave: records.filter(r => r.status === 'on_leave').length,
    total:    records.length,
  };

  const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'late', label: 'Late' },
    { value: 'half_day', label: 'Half Day' },
    { value: 'on_leave', label: 'On Leave' },
  ];

  return (
    <>
      {/* Quick stats bar */}
      {!isLoading && records.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Present',  count: quickStats.present,  color: '#27AE60' },
            { label: 'Absent',   count: quickStats.absent,   color: '#EB5757' },
            { label: 'Late',     count: quickStats.late,     color: '#F2C94C' },
            { label: 'On Leave', count: quickStats.on_leave, color: '#2F80ED' },
          ].map(s => (
            <Card key={s.label} className="border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold text-foreground">{s.count}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">All Employees</CardTitle>
            {!isLoading && (
              <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                {quickStats.total} records
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-sm border rounded-md px-3 py-1.5 bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Date navigator */}
            <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
              <button
                onClick={goToPrevDay}
                className="p-1 rounded hover:bg-background transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              <input
                type="date"
                value={selectedDate}
                max={toDateString(today)}
                onChange={e => setSelectedDate(e.target.value)}
                className="text-sm font-medium bg-transparent border-0 focus:outline-none px-1 text-foreground"
              />
              <button
                onClick={goToNextDay}
                disabled={isToday}
                className="p-1 rounded hover:bg-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Work Hours</TableHead>
                    <TableHead className="text-right">Extra</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        #{record.employee_id}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {record.check_in ? record.check_in.slice(0, 5) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {record.check_out ? record.check_out.slice(0, 5) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell><StatusBadge status={record.status} /></TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {record.work_hours > 0 ? formatWorkHours(record.work_hours) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {record.extra_hours > 0 ? `+${record.extra_hours}h` : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                        {record.notes ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {records.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        No attendance records found for {formatDate(selectedDate)}.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export function AttendancePage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="w-full animate-in fade-in duration-300">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">
            {isAdmin ? 'Attendance' : 'My Attendance'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? 'Monitor and manage attendance across the organization.'
              : 'Track your daily check-ins and working hours.'}
          </p>
        </div>

        {/* Check-in widget — only for non-admin employees */}
        {!isAdmin && (
          <div className="flex items-center gap-3 bg-card p-1.5 pr-4 rounded-xl border shadow-sm">
            <CheckInOutControl />
          </div>
        )}
      </div>

      {isAdmin ? <AdminAttendanceView /> : <EmployeeAttendanceView />}
    </div>
  );
}
