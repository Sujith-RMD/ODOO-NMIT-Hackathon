import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { SalaryStructure } from '../../types';
import { formatCurrency } from '../../utils/format';

interface WageInputProps {
  structure: SalaryStructure;
  onWageChange: (wage: number) => void;
  isCalculating: boolean;
}

export function WageInput({ structure, onWageChange, isCalculating }: WageInputProps) {
  const [wageInput, setWageInput] = useState(structure.monthly_wage.toString());
  const [wageType, setWageType] = useState<'monthly' | 'yearly'>('monthly');
  
  // Update local state when prop changes
  useEffect(() => {
    setWageInput(
      wageType === 'monthly' 
        ? structure.monthly_wage.toString()
        : structure.yearly_wage.toString()
    );
  }, [structure, wageType]);

  const handleBlur = () => {
    const val = parseFloat(wageInput);
    if (!isNaN(val) && val > 0) {
      const monthlyVal = wageType === 'monthly' ? val : val / 12;
      onWageChange(monthlyVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  // Derived hourly rate for display
  const hoursPerDay = 8; // Assumed standard
  const daysPerMonth = structure.working_days_per_month;
  const hourlyRate = structure.monthly_wage / (hoursPerDay * daysPerMonth);

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm mb-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
        <div className="w-full md:w-1/3">
          <Label htmlFor="wage" className="text-muted-foreground uppercase text-xs tracking-wider mb-2 block">
            Base Wage
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
            <Input
              id="wage"
              type="number"
              className="pl-8 text-lg font-semibold h-11"
              value={wageInput}
              onChange={(e) => setWageInput(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              disabled={isCalculating}
            />
          </div>
        </div>

        <div className="flex bg-secondary p-1 rounded-md mb-0.5">
          <button
            onClick={() => setWageType('monthly')}
            className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-colors ${
              wageType === 'monthly' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            / Month
          </button>
          <button
            onClick={() => setWageType('yearly')}
            className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-colors ${
              wageType === 'yearly' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            / Year
          </button>
        </div>

        <div className="ml-auto flex items-center gap-6 mt-4 md:mt-0">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Working Days</p>
            <p className="font-medium text-foreground">{structure.working_days_per_month} days / mo</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Break Time</p>
            <p className="font-medium text-foreground">{structure.break_time_minutes} mins</p>
          </div>
          <div className="text-right border-l pl-6 py-1">
            <p className="text-2xl font-bold text-primary">{formatCurrency(hourlyRate)}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Per Hour</p>
          </div>
        </div>
      </div>
    </div>
  );
}
