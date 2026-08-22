import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeOffService } from '../services/timeOffService';
import { useAuthStore } from '../store/authStore';
import { TimeOffRequest, TimeOffBalance } from '../types';
import {
  Card, CardContent, CardHeader, CardTitle
} from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { formatDate } from '../utils/format';
import { Plus, Check, X, AlertCircle, CalendarDays, Clock3 } from 'lucide-react';

// ── Status badge ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    approved:  { label: 'Approved',  className: 'text-[#27AE60] bg-[#27AE60]/10 border-[#27AE60]/30' },
    rejected:  { label: 'Rejected',  className: 'text-[#EB5757] bg-[#EB5757]/10 border-[#EB5757]/30' },
    pending:   { label: 'Pending',   className: 'text-[#94A3B8] bg-[#94A3B8]/10 border-[#94A3B8]/30' },
    cancelled: { label: 'Cancelled', className: 'text-muted-foreground bg-muted border-border' },
  };
  const cfg = map[status] ?? { label: status, className: '' };
  return <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>;
}

// ── Leave balance cards ───────────────────────────────────────────────

function BalanceCards({ balances, isLoading }: { balances: TimeOffBalance[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {balances.map((b) => (
        <Card key={b.time_off_type.id} className="overflow-hidden border">
          <div className="h-1.5 w-full" style={{ backgroundColor: b.time_off_type.color }} />
          <CardContent className="p-5">
            <p className="text-sm font-medium text-foreground mb-3">{b.time_off_type.name}</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground">{b.available_days}</p>
                <p className="text-xs text-muted-foreground mt-0.5">days available</p>
              </div>
              <div className="text-right text-xs text-muted-foreground space-y-1">
                <p><span className="font-medium text-foreground">{b.used_days}</span> used</p>
                <p><span className="font-medium text-foreground">{b.allocated_days}</span> allocated</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min((b.used_days / b.allocated_days) * 100, 100)}%`,
                  backgroundColor: b.time_off_type.color,
                }}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Employee View ─────────────────────────────────────────────────────

function EmployeeTimeOffView() {
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading: reqLoading } = useQuery<TimeOffRequest[]>({
    queryKey: ['time-off', 'my-requests'],
    queryFn: async () => {
      const res = await timeOffService.getMyRequests();
      return (res as any).items ?? res;
    },
  });

  const { data: balances = [], isLoading: balLoading } = useQuery<TimeOffBalance[]>({
    queryKey: ['time-off', 'my-balances'],
    queryFn: () => timeOffService.getBalances(),
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (id: number) => timeOffService.rejectRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['time-off', 'my-requests'] }),
  });

  return (
    <>
      <BalanceCards balances={balances} isLoading={balLoading} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-semibold">My Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reqLoading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full rounded-md" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: req.time_off_type?.color ?? '#94a3b8' }}
                          />
                          <span className="font-medium text-sm">{req.time_off_type?.name ?? '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(req.start_date)} – {formatDate(req.end_date)}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {req.total_days} {req.total_days === 1 ? 'day' : 'days'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                        {req.reason ?? '—'}
                      </TableCell>
                      <TableCell><StatusBadge status={req.status} /></TableCell>
                      <TableCell>
                        {req.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => cancelMutation.mutate(req.id)}
                            disabled={cancelMutation.isPending}
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {requests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        No time off requests yet.
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

function AdminTimeOffView() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: requests = [], isLoading } = useQuery<TimeOffRequest[]>({
    queryKey: ['time-off', 'admin-requests', statusFilter],
    queryFn: async () => {
      const res = await timeOffService.getAllRequests();
      const items = (res as any).items ?? res;
      return statusFilter ? items.filter((r: TimeOffRequest) => r.status === statusFilter) : items;
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => timeOffService.approveRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['time-off', 'admin-requests'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      timeOffService.rejectRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off', 'admin-requests'] });
      setRejectingId(null);
      setRejectReason('');
    },
  });

  // Quick summary counts
  const counts = {
    pending:  requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const STATUS_OPTIONS = [
    { value: '', label: 'All Requests' },
    { value: 'pending',  label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <>
      {/* Summary pills */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {[
          { label: 'Pending',  count: counts.pending,  color: '#94A3B8' },
          { label: 'Approved', count: counts.approved, color: '#27AE60' },
          { label: 'Rejected', count: counts.rejected, color: '#EB5757' },
        ].map(s => (
          <div
            key={s.label}
            className="flex items-center gap-2 bg-card border rounded-lg px-4 py-2 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-sm font-medium text-foreground">{s.count}</span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4">
          <CardTitle className="text-base font-semibold">Leave Requests</CardTitle>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-sm border rounded-md px-3 py-1.5 bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right w-32">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <React.Fragment key={req.id}>
                      <TableRow>
                        <TableCell className="font-medium text-sm">
                          {req.employee?.full_name ?? `Employee #${req.employee_id}`}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: req.time_off_type?.color ?? '#94a3b8' }}
                            />
                            <span className="text-sm">{req.time_off_type?.name ?? '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {formatDate(req.start_date)} – {formatDate(req.end_date)}
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">{req.total_days}d</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[140px] truncate">
                          {req.reason ?? '—'}
                        </TableCell>
                        <TableCell><StatusBadge status={req.status} /></TableCell>
                        <TableCell className="text-right">
                          {req.status === 'pending' && (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => approveMutation.mutate(req.id)}
                                disabled={approveMutation.isPending}
                                className="p-1.5 rounded-md text-[#27AE60] hover:bg-[#27AE60]/10 transition-colors disabled:opacity-50"
                                title="Approve"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setRejectingId(req.id)}
                                className="p-1.5 rounded-md text-[#EB5757] hover:bg-[#EB5757]/10 transition-colors"
                                title="Reject"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                      {/* Inline rejection reason input */}
                      {rejectingId === req.id && (
                        <TableRow className="bg-[#EB5757]/5 hover:bg-[#EB5757]/5">
                          <TableCell colSpan={7} className="py-2 px-4">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-[#EB5757] flex-shrink-0" />
                              <input
                                autoFocus
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="Enter rejection reason…"
                                className="flex-1 text-sm border rounded-md px-3 py-1.5 bg-background focus:ring-1 focus:ring-[#EB5757] focus:outline-none"
                              />
                              <button
                                onClick={() => rejectMutation.mutate({ id: req.id, reason: rejectReason })}
                                disabled={!rejectReason.trim() || rejectMutation.isPending}
                                className="text-sm font-medium px-3 py-1.5 bg-[#EB5757] text-white rounded-md hover:bg-[#EB5757]/90 disabled:opacity-50"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                className="text-sm text-muted-foreground hover:text-foreground"
                              >
                                Cancel
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                  {requests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        No {statusFilter || ''} requests found.
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

import { RequestTimeOffModal } from '../components/time-off/RequestTimeOffModal';

export function TimeOffPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="w-full animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">
            {isAdmin ? 'Leave Management' : 'Time Off'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? 'Review and manage employee leave requests across the organization.'
              : 'Manage your leave balances and time off requests.'}
          </p>
        </div>

        {/* New Request button — employee only */}
        {!isAdmin && (
          <RequestTimeOffModal />
        )}
      </div>

      {isAdmin ? <AdminTimeOffView /> : <EmployeeTimeOffView />}
    </div>
  );
}
