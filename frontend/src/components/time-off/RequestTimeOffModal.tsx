import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { aiService } from '../../services/aiService';
import { timeOffService } from '../../services/timeOffService';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Plus, ChevronLeft, ChevronRight, Wand2, Paperclip, Loader2 } from 'lucide-react';
import './LeaveCalendar.css';

// ─── Date helpers ──────────────────────────────────────────────────────────
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function isWeekend(d: Date) { return d.getDay() === 0 || d.getDay() === 6; }
function stripTime(d: Date) { const c = new Date(d); c.setHours(0,0,0,0); return c; }
function addDays(d: Date, n: number) { const c = new Date(d); c.setDate(c.getDate()+n); return c; }

function computeRange(start: Date, end: Date) {
  const working = new Set<string>();
  const weekends = new Set<string>();
  // Always strip time so comparison is purely date-based (Bug 4 fix)
  const from = stripTime(start <= end ? start : end);
  const to   = stripTime(start <= end ? end   : start);
  let cursor = stripTime(from);
  while (cursor.getTime() <= to.getTime()) {
    const key = dateKey(cursor);
    isWeekend(cursor) ? weekends.add(key) : working.add(key);
    cursor = addDays(cursor, 1);
  }
  return { working, weekends };
}

function formatDisplay(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── LeaveCalendar component ───────────────────────────────────────────────
interface LeaveCalendarProps {
  rangeStart: Date | null;
  rangeEnd:   Date | null;
  hoverDate:  Date | null;
  viewMonth:  Date;          // first-of-month
  onDayClick: (d: Date) => void;
  onDayHover: (d: Date | null) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

function LeaveCalendar({
  rangeStart, rangeEnd, hoverDate, viewMonth,
  onDayClick, onDayHover, onPrevMonth, onNextMonth
}: LeaveCalendarProps) {
  const today = stripTime(new Date());
  const year  = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Determine confirmed range
  let rangeWorkingKeys = new Set<string>();
  let rangeWeekendKeys = new Set<string>();
  if (rangeStart && rangeEnd) {
    const r = computeRange(rangeStart, rangeEnd);
    rangeWorkingKeys = r.working;
    rangeWeekendKeys = r.weekends;
  }

  // Determine preview range (while dragging second point)
  let previewFrom: Date | null = null;
  let previewTo:   Date | null = null;
  if (rangeStart && !rangeEnd && hoverDate) {
    previewFrom = rangeStart <= hoverDate ? rangeStart : hoverDate;
    previewTo   = rangeStart <= hoverDate ? hoverDate  : rangeStart;
  }

  const cells: React.ReactNode[] = [];

  // blank cells
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`b${i}`} className="cal-day blank" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new Date(year, month, d);
    const key = dateKey(cellDate);
    const isPast    = cellDate < today;
    const isToday   = cellDate.getTime() === today.getTime();
    const rStart    = rangeStart ? dateKey(rangeStart) : null;
    const rEnd      = rangeEnd   ? dateKey(rangeEnd)   : null;

    const classes: string[] = ['cal-day'];

    if (isPast) {
      classes.push('disabled');
    } else {
      if (isToday) classes.push('today');

      // Confirmed range styling
      if (rangeStart && rangeEnd) {
        const from = rangeStart <= rangeEnd ? rangeStart : rangeEnd;
        const to   = rangeStart <= rangeEnd ? rangeEnd   : rangeStart;
        const fKey = dateKey(from), tKey = dateKey(to);
        if (cellDate >= stripTime(from) && cellDate <= stripTime(to)) {
          if (key === fKey && key === tKey) classes.push('range-single');
          else if (key === fKey) classes.push('range-start');
          else if (key === tKey) classes.push('range-end');
          else classes.push('range-middle');
          if (rangeWeekendKeys.has(key)) classes.push('weekend-excluded');
        }
      } else if (rangeStart && !rangeEnd) {
        const isAnchor = key === rStart;
        if (isAnchor) classes.push('range-single');
        // preview — only apply to non-anchor cells to avoid class conflicts (Bug 3 fix)
        if (!isAnchor && previewFrom && previewTo) {
          if (cellDate >= stripTime(previewFrom) && cellDate <= stripTime(previewTo)) {
            const pfKey = dateKey(previewFrom), ptKey = dateKey(previewTo);
            if (key === pfKey) classes.push('preview-start');
            else if (key === ptKey) classes.push('preview-end');
            else classes.push('preview-middle');
          }
        }
      }
    }

    cells.push(
      <div
        key={key}
        className={classes.join(' ')}
        onClick={isPast ? undefined : () => onDayClick(cellDate)}
        onMouseEnter={isPast ? undefined : () => onDayHover(cellDate)}
        onMouseLeave={isPast ? undefined : () => onDayHover(null)}
      >
        {d}
      </div>
    );
  }

  const workingDays = rangeStart && rangeEnd
    ? computeRange(rangeStart, rangeEnd).working.size
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="cal-head">
        <div className="cal-nav">
          <button type="button" onClick={onPrevMonth} aria-label="Previous month">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>
        <span className="month">{MONTH_NAMES[month]} {year}</span>
        <div className="cal-nav">
          <button type="button" onClick={onNextMonth} aria-label="Next month">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="cal-dow">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <span key={d}>{d}</span>)}
      </div>

      {/* Grid */}
      <div className="cal-grid">{cells}</div>

      {/* Hint row */}
      <div className="selection-note mt-3.5 text-xs text-muted-foreground flex items-center justify-between">
        <span>
          {!rangeStart
            ? 'Click your first leave day'
            : !rangeEnd
              ? 'Now click the last leave day'
              : `${formatDisplay(rangeStart < rangeEnd ? rangeStart : rangeEnd)} → ${formatDisplay(rangeStart < rangeEnd ? rangeEnd : rangeStart)}`}
        </span>
        <span><b>{workingDays}</b> working days</span>
      </div>

      {rangeEnd && (() => {
        const { weekends } = computeRange(rangeStart!, rangeEnd);
        return weekends.size > 0
          ? <p className="text-[11px] text-muted-foreground mt-2">{weekends.size} weekend day(s) excluded automatically.</p>
          : null;
      })()}
    </div>
  );
}

// ─── Main Modal ────────────────────────────────────────────────────────────
export function RequestTimeOffModal() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // Calendar state
  const today = stripTime(new Date());
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd,   setRangeEnd]   = useState<Date | null>(null);
  const [hoverDate,  setHoverDate]  = useState<Date | null>(null);

  // Step state
  const [step, setStep] = useState<1 | 2>(1);

  // Step 2 form state
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [reason, setReason] = useState('');
  
  // AI & Attachment state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);

  const handleAIPrefill = async () => {
    if (!aiPrompt.trim()) return;
    setIsParsing(true);
    setAiError(null);
    try {
      const parsed = await aiService.parseTimeOffDescription(aiPrompt);
      if (parsed.start_date) {
        const d = new Date(parsed.start_date + 'T00:00:00');
        setRangeStart(stripTime(d));
      }
      if (parsed.end_date) {
        const d = new Date(parsed.end_date + 'T00:00:00');
        setRangeEnd(stripTime(d));
      }
      if (parsed.reason) {
        setReason(parsed.reason);
      }
      if (parsed.type) {
        const lowerType = parsed.type.toLowerCase();
        const typeMatch = leaveTypes.find((t: any) => t.name.toLowerCase().includes(lowerType));
        if (typeMatch) setLeaveTypeId(String(typeMatch.id));
      }
      
      setAiPrompt('');
    } catch (e) {
      setAiError("Couldn't parse that — please fill the form manually");
    } finally {
      setIsParsing(false);
    }
  };

  // Fetch leave types
  const { data: leaveTypes = [] } = useQuery({
    queryKey: ['time-off-types'],
    queryFn: async () => {
      try {
        const res = await api.get('/time-off/types');
        return res.data;
      } catch {
        return [
          { id: 1, name: 'Paid Leave' },
          { id: 2, name: 'Sick Leave' },
          { id: 3, name: 'Unpaid Leave' },
        ];
      }
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: { time_off_type_id: number; start_date: string; end_date: string; reason?: string }) => {
      await timeOffService.createRequest(data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off', 'my-requests'] });
      queryClient.invalidateQueries({ queryKey: ['time-off', 'my-balances'] });
      handleClose();
    }
  });

  const handleClose = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      setStep(1);
      setRangeStart(null); setRangeEnd(null); setHoverDate(null);
      setLeaveTypeId(''); setReason('');
      setAiPrompt(''); setAiError(null); setAttachment(null);
      const d = new Date(); d.setDate(1);
      setViewMonth(d);
    }, 200);
  }, []);

  const handleDayClick = useCallback((d: Date) => {
    const strippedD = stripTime(d);
    const strippedToday = stripTime(new Date());
    // Bug 2 fix: guard against past dates (belt-and-suspenders beyond the render guard)
    if (strippedD.getTime() < strippedToday.getTime()) return;

    if (!rangeStart || rangeEnd) {
      // Start fresh — either no selection yet, or range already complete (re-click starts over)
      setRangeStart(strippedD);
      setRangeEnd(null);
      setHoverDate(null);
    } else {
      // Bug 1 fix: clicking the same date as rangeStart → treat as single-day selection (confirm it)
      if (strippedD.getTime() === rangeStart.getTime()) {
        setRangeEnd(strippedD);
      } else {
        setRangeEnd(strippedD);
      }
      // Bug 4 fix: clear hover once range is confirmed so no stale preview lingers
      setHoverDate(null);
    }
  }, [rangeStart, rangeEnd]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rangeStart || !rangeEnd || !leaveTypeId) return;
    const from = rangeStart <= rangeEnd ? rangeStart : rangeEnd;
    const to   = rangeStart <= rangeEnd ? rangeEnd   : rangeStart;
    mutation.mutate({
      time_off_type_id: parseInt(leaveTypeId, 10),
      start_date: dateKey(from),
      end_date:   dateKey(to),
      reason: reason || undefined,
    });
  };

  // Derived info for step 2
  const confirmedFrom = rangeStart && rangeEnd
    ? (rangeStart <= rangeEnd ? rangeStart : rangeEnd)
    : null;
  const confirmedTo = rangeStart && rangeEnd
    ? (rangeStart <= rangeEnd ? rangeEnd : rangeStart)
    : null;
  const workingDays = confirmedFrom && confirmedTo
    ? computeRange(confirmedFrom, confirmedTo).working.size : 0;

  // Chip dates for step 2
  const chipDates: string[] = [];
  if (confirmedFrom && confirmedTo) {
    const { working } = computeRange(confirmedFrom, confirmedTo);
    working.forEach(k => chipDates.push(k));
    chipDates.sort();
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Request Time Off
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[440px] overflow-hidden p-0" onPointerDownOutside={handleClose}>
        {/* Step dots header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <DialogTitle className="text-base font-bold">
            {step === 1 ? 'Select leave days' : 'Leave details'}
          </DialogTitle>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className={`inline-block h-1.5 rounded-full transition-all ${step === 1 ? 'w-5 bg-primary' : 'w-1.5 bg-border'}`} />
              <span className={`inline-block h-1.5 rounded-full transition-all ${step === 2 ? 'w-5 bg-primary' : 'w-1.5 bg-border'}`} />
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          {/* ── STEP 1: Calendar ─────────────────────────────────── */}
          {step === 1 && (
            <div>
              {/* AI Prefill */}
              <div className="mb-5 bg-primary/5 border border-primary/20 rounded-xl p-3">
                <label className="flex items-center gap-1.5 text-xs font-bold text-primary mb-2">
                  <Wand2 className="h-3.5 w-3.5" />
                  AI Auto-Fill
                </label>
                <div className="flex gap-2">
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="E.g. 'I need next Monday and Tuesday off for a family wedding'"
                    className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                    rows={2}
                  />
                  <Button 
                    type="button" 
                    onClick={handleAIPrefill} 
                    disabled={isParsing || !aiPrompt.trim()}
                    className="self-end shrink-0"
                  >
                    {isParsing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fill form'}
                  </Button>
                </div>
                {aiError && <p className="text-xs text-destructive mt-2">{aiError}</p>}
              </div>

              <LeaveCalendar
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                hoverDate={hoverDate}
                viewMonth={viewMonth}
                onDayClick={handleDayClick}
                onDayHover={setHoverDate}
                onPrevMonth={() => setViewMonth(m => { const n = new Date(m); n.setMonth(n.getMonth()-1); return n; })}
                onNextMonth={() => setViewMonth(m => { const n = new Date(m); n.setMonth(n.getMonth()+1); return n; })}
              />
              <div className="flex gap-2.5 mt-5">
                <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  disabled={!rangeStart || !rangeEnd}
                  onClick={() => setStep(2)}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Details ──────────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              {/* Day chips */}
              <div className="day-chips mb-4">
                {chipDates.slice(0, 10).map(k => (
                  <span key={k} className="day-chip">
                    {new Date(k + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                ))}
                {chipDates.length > 10 && (
                  <span className="day-chip">+{chipDates.length - 10} more</span>
                )}
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                <b className="text-foreground">{workingDays} working day{workingDays !== 1 ? 's' : ''}</b> selected
                {' '}({formatDisplay(confirmedFrom!)} → {formatDisplay(confirmedTo!)})
              </p>

              {/* Leave type */}
              <div className="space-y-1.5 mb-4">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Leave type
                </label>
                <select
                  value={leaveTypeId}
                  onChange={e => setLeaveTypeId(e.target.value)}
                  required
                  className="w-full border border-border rounded-[10px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                >
                  <option value="" disabled>Select a type…</option>
                  {leaveTypes.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div className="space-y-1.5 mb-5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Reason <span className="font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Briefly describe your reason…"
                  rows={3}
                  className="w-full border border-border rounded-[10px] px-3 py-2.5 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>

              {/* Attachment */}
              {(leaveTypeId === '2' || true) && (
                <div className="space-y-1.5 mb-5">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Attachment <span className="font-normal normal-case">(Medical cert, etc)</span>
                  </label>
                  <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:bg-muted/50 transition-colors">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-1">
                      <Paperclip className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-foreground font-medium">
                        {attachment ? attachment.name : "Click to upload file"}
                      </span>
                      <span className="text-xs text-muted-foreground">PDF, JPG, PNG up to 5MB</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex gap-2.5">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  ← Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={mutation.isPending || !leaveTypeId}
                >
                  {mutation.isPending ? 'Submitting…' : 'Submit Request'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
