import React from 'react';
import { SalaryCalculationResult } from '../../types';
import { formatCurrency } from '../../utils/format';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';

interface SalaryComponentsTableProps {
  result: SalaryCalculationResult;
  isCalculating: boolean;
}

export function SalaryComponentsTable({ result, isCalculating }: SalaryComponentsTableProps) {
  // Helper to format the basis string for display
  const getBasisText = (basis: string, percentage: number, fixed: number) => {
    if (basis === 'wage') return `${percentage}% of Wage`;
    if (basis === 'basic') return `${percentage}% of Basic`;
    if (basis === 'fixed') {
      if (percentage === 0 && fixed > 0) return `Fixed Amount`;
      return 'Remainder of Wage';
    }
    return basis;
  };

  const getHelperText = (name: string) => {
    switch (name) {
      case 'Standard Allowance': return 'A predetermined, fixed amount';
      case 'Performance Bonus': return 'Variable, company-defined';
      case 'Fixed Allowance': return 'Remainder balancing figure to match Wage';
      default: return '';
    }
  };

  return (
    <div className={`border rounded-lg bg-card overflow-hidden transition-opacity duration-300 ${isCalculating ? 'opacity-50' : 'opacity-100'}`}>
      <div className="p-5 border-b bg-muted/30">
        <h3 className="text-lg font-medium text-foreground">Earnings Breakdown</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-[40%]">Component</TableHead>
            <TableHead>Basis</TableHead>
            <TableHead className="text-right">%</TableHead>
            <TableHead className="text-right w-[20%]">Amount / Month</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.components.filter(c => c.component_type === 'earning').map((component) => (
            <TableRow key={component.id}>
              <TableCell>
                <p className="font-medium text-foreground">{component.name}</p>
                {getHelperText(component.name) && (
                  <p className="text-xs text-muted-foreground mt-0.5">{getHelperText(component.name)}</p>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="font-normal text-muted-foreground bg-background">
                  {getBasisText(component.calculation_basis, component.percentage, component.fixed_amount)}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {component.percentage > 0 ? `${component.percentage}%` : '-'}
              </TableCell>
              <TableCell className="text-right font-medium text-foreground">
                {formatCurrency(component.monthly_amount)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-muted/10 hover:bg-muted/10">
            <TableCell colSpan={3} className="font-semibold text-foreground text-right border-t">
              Gross Monthly Earnings
            </TableCell>
            <TableCell className="text-right font-bold text-foreground text-base border-t">
              {formatCurrency(result.total_earnings)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
