import { useState, useEffect, useCallback } from 'react';
import { salaryService } from '../services/salaryService';
import { SalaryCalculationResult, SalaryStructure } from '../types';

export function useSalaryCalculation(employeeId: number) {
  const [structure, setStructure] = useState<SalaryStructure | null>(null);
  const [result, setResult] = useState<SalaryCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);

  const fetchStructure = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await salaryService.getStructure(employeeId);
      setStructure(data);
      // Run initial calculation
      const calcData = await salaryService.calculate(data.monthly_wage);
      setResult(calcData);
    } catch (error) {
      console.error('Failed to load salary structure', error);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchStructure();
  }, [fetchStructure]);

  const updateWage = async (newWage: number) => {
    if (!structure) return;
    
    setIsCalculating(true);
    try {
      // 1. Update structure state optimistic
      const updatedStructure = { ...structure, monthly_wage: newWage, yearly_wage: newWage * 12 };
      setStructure(updatedStructure);
      
      // 2. Recompute the breakdown
      const calcData = await salaryService.calculate(newWage);
      setResult(calcData);
      
      // 3. Persist to backend (fire and forget for now, or await)
      await salaryService.updateStructure(employeeId, { monthly_wage: newWage });
    } catch (error) {
      console.error('Failed to calculate new wage', error);
    } finally {
      setIsCalculating(false);
    }
  };

  return {
    structure,
    result,
    isLoading,
    isCalculating,
    updateWage,
    refresh: fetchStructure
  };
}
