import React from 'react';
import { TodayStatus } from '../../types';
import { Plane } from 'lucide-react';

interface StatusDotProps {
  status: TodayStatus;
  className?: string;
}

export function StatusDot({ status, className = '' }: StatusDotProps) {
  if (status === 'present') {
    return <span className={`inline-block h-3 w-3 rounded-full bg-status-present border-2 border-white ${className}`} title="Present" />;
  }
  
  if (status === 'absent') {
    return <span className={`inline-block h-3 w-3 rounded-full bg-status-absent border-2 border-white ${className}`} title="Absent" />;
  }
  
  if (status === 'on_leave') {
    return (
      <span className={`inline-flex items-center justify-center h-4 w-4 rounded-full bg-status-on-leave text-white border-2 border-white ${className}`} title="On Leave">
        <Plane className="h-2 w-2" />
      </span>
    );
  }
  
  return null;
}
