import React from 'react';
import { EmployeeProfile } from '../../types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Mail, Phone, Hash } from 'lucide-react';

interface ProfileHeaderProps {
  employee: EmployeeProfile;
}

export function ProfileHeader({ employee }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b">
      <Avatar className="h-28 w-28 border-2 border-white shadow-sm">
        <AvatarImage src={employee.avatar_url || ''} alt={employee.full_name} />
        <AvatarFallback className="text-3xl font-medium bg-secondary text-secondary-foreground">
          {employee.initials}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left">
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">{employee.full_name}</h1>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Odoo India
        </p>
        
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 text-sm text-foreground/80">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <span>{employee.login_id}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href={`mailto:${employee.email}`} className="hover:text-primary transition-colors">
              {employee.email}
            </a>
          </div>
          {employee.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${employee.phone}`} className="hover:text-primary transition-colors">
                {employee.phone}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
