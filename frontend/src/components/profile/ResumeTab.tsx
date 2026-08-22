import React from 'react';
import { EmployeeProfile } from '../../types';

export function ResumeTab({ employee }: { employee: EmployeeProfile }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">Professional Experience</h3>
        <div className="space-y-4">
          <div className="relative pl-6 border-l-2 border-border pb-4">
            <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-background bg-primary"></span>
            <h4 className="font-medium text-foreground">{employee.position || 'Employee'}</h4>
            <p className="text-sm text-primary mb-2">Odoo India • {employee.date_of_joining} - Present</p>
            <p className="text-sm text-foreground/80">Working in the {employee.department} department.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
