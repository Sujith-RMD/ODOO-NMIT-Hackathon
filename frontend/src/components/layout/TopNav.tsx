import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard, Users, Clock, CalendarOff, DollarSign,
  Bell, LogOut, User, Settings, ChevronDown,
  Timer, CheckCircle2, Circle
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { attendanceService } from '../../services/attendanceService';

// ── Live Clock ──────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
  );
  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums font-mono text-xs">{time}</span>;
}

// ── Check In / Out Control ──────────────────────────────────────
function CheckInOutControl() {
  const { user } = useAuthStore();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState('');

  // Live elapsed timer
  useEffect(() => {
    if (!isCheckedIn || !checkInTime) { setElapsed(''); return; }
    const start = new Date(checkInTime).getTime();
    const update = () => {
      const diff = Date.now() - start;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setElapsed(`${h}h ${m}m`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [isCheckedIn, checkInTime]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (!isCheckedIn) {
        const res = await attendanceService.checkIn();
        setIsCheckedIn(true);
        setCheckInTime(res.attendance.check_in ?? new Date().toISOString());
      } else {
        await attendanceService.checkOut();
        setIsCheckedIn(false);
        setCheckInTime(null);
      }
    } catch {
      // mock: toggle anyway for demo
      setIsCheckedIn(p => !p);
      if (!isCheckedIn) setCheckInTime(new Date().toISOString());
      else setCheckInTime(null);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === 'admin') return null;

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        'group flex items-center gap-2 h-9 px-3 rounded-lg border text-sm font-medium transition-all duration-200 disabled:opacity-60 select-none',
        isCheckedIn
          ? 'bg-[#27AE60]/10 text-[#27AE60] border-[#27AE60]/30 hover:bg-[#27AE60]/20'
          : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
      )}
    >
      {isCheckedIn ? (
        <>
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="flex flex-col items-start leading-none">
            <span className="text-[11px] font-semibold">Checked In</span>
            {elapsed && <span className="text-[10px] opacity-70">{elapsed}</span>}
          </span>
          <span className="text-[10px] opacity-60 pl-1 border-l border-current/30 ml-1">tap to out</span>
        </>
      ) : (
        <>
          <Circle className="h-4 w-4 shrink-0" />
          <span className="flex flex-col items-start leading-none">
            <span className="text-[11px] font-semibold">Check In</span>
            <LiveClock />
          </span>
        </>
      )}
    </button>
  );
}

// ── Notifications Bell ──────────────────────────────────────────
function NotificationBell() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/notifications')}
      className="relative flex items-center justify-center h-9 w-9 rounded-lg border border-border hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Notifications"
    >
      <Bell className="h-4 w-4" />
      {/* Unread dot — wire to real unread count later */}
      <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#EB5757] border-2 border-background" />
    </button>
  );
}

// ── Avatar / Profile Menu ───────────────────────────────────────
function AvatarMenu() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  if (!user) return null;

  // Initials from email since we don't store first_name on the User store
  const initials = user.email.slice(0, 2).toUpperCase();
  const roleLabel = user.role === 'admin' ? 'Admin' : 'Employee';
  const roleColor = user.role === 'admin' ? 'text-primary bg-primary/10' : 'text-[#27AE60] bg-[#27AE60]/10';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 h-9 pl-1 pr-2.5 rounded-lg border border-border hover:bg-secondary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar className="h-7 w-7">
            <AvatarImage src="" alt={user.login_id} />
            <AvatarFallback className="text-[11px] font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[11px] font-semibold text-foreground">{user.login_id}</span>
            <span className={cn('text-[10px] font-medium rounded px-1', roleColor)}>{roleLabel}</span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-0.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 mt-1">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-2.5 py-1">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p className="text-xs font-semibold text-foreground truncate">{user.email}</p>
              <p className="text-[11px] text-muted-foreground">{user.login_id}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/profile')} className="gap-2 cursor-pointer">
          <User className="h-4 w-4 text-muted-foreground" />
          My Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/notifications')} className="gap-2 cursor-pointer">
          <Bell className="h-4 w-4 text-muted-foreground" />
          Notifications
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="gap-2 cursor-pointer text-[#EB5757] focus:text-[#EB5757] focus:bg-[#EB5757]/10"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Nav items ───────────────────────────────────────────────────
const adminNavItems = [
  { name: 'Employees',   href: '/employees',   icon: Users },
  { name: 'Attendance',  href: '/attendance',  icon: Clock },
  { name: 'Time Off',    href: '/time-off',    icon: CalendarOff },
  { name: 'Payroll',     href: '/salary',      icon: DollarSign },
];

const employeeNavItems = [
  { name: 'Employees',   href: '/employees',   icon: Users },
  { name: 'Attendance',  href: '/attendance',  icon: Clock },
  { name: 'Time Off',    href: '/time-off',    icon: CalendarOff },
];

// ── TopNav ──────────────────────────────────────────────────────
export function TopNav() {
  const { user } = useAuthStore();
  if (!user) return null;

  const navItems = user.role === 'admin' ? adminNavItems : employeeNavItems;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex h-14 items-center gap-6 px-4 md:px-6 max-w-7xl mx-auto w-full">

        {/* Logo */}
        <NavLink to="/employees" className="flex items-center gap-1 shrink-0 select-none">
          <img src="/dayflowbg.png" alt="Dayflow" className="h-12 w-12 object-contain" />
          <span className="font-bold text-lg tracking-tight text-foreground">
            Day<span className="text-primary">flow</span>
          </span>
        </NavLink>

        {/* Nav links */}
        <nav className="flex items-center gap-0.5 flex-1">
          {navItems.map(({ name, href, icon: Icon }) => (
            <NavLink
              key={href}
              to={href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'text-primary bg-primary/8'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {name}
            </NavLink>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          <CheckInOutControl />
          <NotificationBell />
          <AvatarMenu />
        </div>
      </div>
    </header>
  );
}
