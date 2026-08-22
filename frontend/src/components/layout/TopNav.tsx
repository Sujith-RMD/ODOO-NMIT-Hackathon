import React from 'react';
import { NavLink } from 'react-router-dom';
import { AvatarMenu } from './AvatarMenu';
import { CheckInOutControl } from '../attendance/CheckInOutControl';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

export function TopNav() {
  const { user } = useAuthStore();

  const navItems = [
    { name: 'Employees', href: '/employees' },
    { name: 'Attendance', href: '/attendance' },
    { name: 'Time Off', href: '/time-off' },
  ];

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6 max-w-7xl mx-auto w-full">
        <div className="mr-6 flex items-center">
          <NavLink to="/" className="flex items-center space-x-2">
            <span className="font-bold text-lg text-primary tracking-tight">Day<span className="text-foreground">flow</span></span>
          </NavLink>
        </div>
        
        <nav className="flex items-center space-x-6 text-sm font-medium flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'transition-colors hover:text-foreground/80 relative py-4',
                  isActive ? 'text-primary' : 'text-foreground/60'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 h-[2px] w-full bg-primary" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <CheckInOutControl />
          <AvatarMenu />
        </div>
      </div>
    </header>
  );
}
