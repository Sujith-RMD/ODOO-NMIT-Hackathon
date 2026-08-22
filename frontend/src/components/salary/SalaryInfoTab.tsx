import React, { useState } from 'react';
import { EmployeeProfile } from '../../types';
import { useSalaryCalculation } from '../../hooks/useSalaryCalculation';
import { WageInput } from './WageInput';
import { SalaryComponentsTable } from './SalaryComponentsTable';
import { TaxDeductionsSection } from './TaxDeductionsSection';
import { Skeleton } from '../ui/skeleton';
import { aiService } from '../../services/aiService';
import { Button } from '../ui/button';
import { Wand2, Loader2 } from 'lucide-react';

export function SalaryInfoTab({ employee }: { employee: EmployeeProfile }) {
  const { structure, result, isLoading, isCalculating, updateWage } = useSalaryCalculation(employee.id);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  const handleExplain = async () => {
    if (!result) return;
    setIsExplaining(true);
    setExplainError(null);
    try {
      const text = await aiService.explainPayslip(result);
      setExplanation(text);
    } catch (e) {
      setExplainError("Failed to generate explanation. Please check your API key.");
    } finally {
      setIsExplaining(false);
    }
  };

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

      <div className="mt-6 border-t border-border pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">AI Payslip Explanation</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExplain} 
            disabled={isExplaining}
            className="gap-2"
          >
            {isExplaining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {explanation ? 'Regenerate Explanation' : 'Explain this payslip'}
          </Button>
        </div>
        
        {explainError && <p className="text-sm text-destructive">{explainError}</p>}
        {explanation && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm leading-relaxed text-foreground animate-in fade-in">
            {explanation}
          </div>
        )}
      </div>
    </div>
  );
}
