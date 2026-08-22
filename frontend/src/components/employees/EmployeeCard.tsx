import React from 'react';
import { Link } from 'react-router-dom';
import { EmployeeCard as EmployeeCardType } from '../../types';
import { Card } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { StatusDot } from './StatusDot';

interface EmployeeCardProps {
  employee: EmployeeCardType;
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  return (
    <Link to={`/employees/${employee.id}`} className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg">
      <Card className="hover:border-primary/50 transition-default relative p-5">
        <div className="absolute top-4 right-4">
          <StatusDot status={employee.status} />
        </div>
        
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-16 w-16 border mb-3">
            <AvatarImage src={employee.avatar_url || ''} alt={employee.full_name} />
            <AvatarFallback className="text-lg">{employee.initials}</AvatarFallback>
          </Avatar>
          
          <h3 className="font-semibold text-foreground text-base tracking-tight mb-0.5 truncate w-full">
            {employee.full_name}
          </h3>
          <p className="text-sm text-muted-foreground truncate w-full">
            {employee.position || 'No Position'}
          </p>
          <div className="mt-3 px-2 py-0.5 bg-secondary text-secondary-foreground text-xs font-medium rounded-full truncate max-w-full">
            {employee.department || 'No Department'}
          </div>
        </div>
      </Card>
    </Link>
  );
}
