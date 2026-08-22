import React from 'react';
import { TodayStatus } from '../../types';
import { Plane, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatusDotProps {
  status: TodayStatus;
  className?: string;
}

export function StatusDot({ status, className }: StatusDotProps) {
  if (status === 'present') {
    return (
      <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#27AE60]/10 border border-[#27AE60]/20 text-[#27AE60] text-[9px] font-semibold tracking-wide uppercase shadow-sm", className)}>
        <CheckCircle2 className="h-2.5 w-2.5" />
        Present
      </div>
    );
  }
  
  if (status === 'absent') {
    return (
      <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F2C94C]/10 border border-[#F2C94C]/20 text-[#D4A017] text-[9px] font-semibold tracking-wide uppercase shadow-sm", className)}>
        <Clock className="h-2.5 w-2.5" />
        Absent
      </div>
    );
  }
  
  if (status === 'on_leave') {
    return (
      <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] font-semibold tracking-wide uppercase shadow-sm", className)}>
        <Plane className="h-2.5 w-2.5" />
        On Leave
      </div>
    );
  }
  
  return null;
}
