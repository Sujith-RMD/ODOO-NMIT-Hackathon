import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { attendanceService } from '../../services/attendanceService';

export function CheckInOutControl() {
  const { user } = useAuthStore();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // In a real app, you'd fetch the current state on mount
  // For demo, we default to checked out.

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (!isCheckedIn) {
        const res = await attendanceService.checkIn();
        setIsCheckedIn(true);
        if (res.attendance.check_in) {
           setCheckInTime(res.attendance.check_in);
        } else {
           setCheckInTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
        }
      } else {
        await attendanceService.checkOut();
        setIsCheckedIn(false);
        setCheckInTime(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center space-x-3 bg-secondary/50 rounded-full px-1 py-1 pr-4 border shadow-sm">
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`flex items-center justify-center h-8 px-4 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${
          isCheckedIn
            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        }`}
      >
        {isCheckedIn ? 'Check Out →' : 'Check In →'}
      </button>
      
      {isCheckedIn && checkInTime && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]" />
          <span>Since {checkInTime.slice(0, 5)}</span>
        </div>
      )}
      {!isCheckedIn && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span>Offline</span>
        </div>
      )}
    </div>
  );
}
