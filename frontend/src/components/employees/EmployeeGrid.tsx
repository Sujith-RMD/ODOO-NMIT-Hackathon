import React from 'react';
import { EmployeeCard as EmployeeCardType } from '../../types';
import { EmployeeCard } from './EmployeeCard';
import { Skeleton } from '../ui/skeleton';

interface EmployeeGridProps {
  employees: EmployeeCardType[];
  isLoading: boolean;
}

export function EmployeeGrid({ employees, isLoading }: EmployeeGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-5 flex flex-col items-center">
            <Skeleton className="h-16 w-16 rounded-full mb-3" />
            <Skeleton className="h-5 w-3/4 mb-1" />
            <Skeleton className="h-4 w-1/2 mb-3" />
            <Skeleton className="h-5 w-2/3 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border rounded-lg border-dashed mt-6 bg-secondary/20">
        <p className="text-lg font-medium text-foreground">No employees found</p>
        <p className="text-sm text-muted-foreground mt-1">Adjust your search or add a new employee.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-6">
      {employees.map((employee) => (
        <EmployeeCard key={employee.id} employee={employee} />
      ))}
    </div>
  );
}
