import React from 'react';
import { EmployeeProfile } from '../../types';
import { useSalaryCalculation } from '../../hooks/useSalaryCalculation';
import { WageInput } from './WageInput';
import { SalaryComponentsTable } from './SalaryComponentsTable';
import { TaxDeductionsSection } from './TaxDeductionsSection';
import { Skeleton } from '../ui/skeleton';

export function SalaryInfoTab({ employee }: { employee: EmployeeProfile }) {
  const { structure, result, isLoading, isCalculating, updateWage } = useSalaryCalculation(employee.id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (!structure || !result) {
    return (
      <div className="p-8 text-center text-muted-foreground border rounded-lg border-dashed">
        Salary structure not configured for this employee.
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <WageInput 
        structure={structure} 
        onWageChange={updateWage} 
        isCalculating={isCalculating} 
      />
      
      <SalaryComponentsTable 
        result={result} 
        isCalculating={isCalculating} 
      />
      
      <TaxDeductionsSection 
        result={result} 
      />
    </div>
  );
}
