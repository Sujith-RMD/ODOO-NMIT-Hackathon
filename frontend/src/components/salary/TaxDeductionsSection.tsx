import React from 'react';
import { SalaryCalculationResult } from '../../types';
import { formatCurrency } from '../../utils/format';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';

interface TaxDeductionsSectionProps {
  result: SalaryCalculationResult;
}

export function TaxDeductionsSection({ result }: TaxDeductionsSectionProps) {
  return (
    <div className="border rounded-lg bg-card overflow-hidden mt-6">
      <div className="p-5 border-b bg-muted/30">
        <h3 className="text-lg font-medium text-foreground">Tax & Deductions</h3>
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
          <TableRow>
            <TableCell>
              <p className="font-medium text-foreground">Provident Fund (PF) - Employee</p>
              <p className="text-xs text-muted-foreground mt-0.5">Calculated based on Basic Salary</p>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="font-normal text-muted-foreground bg-background">
                12% of Basic
              </Badge>
            </TableCell>
            <TableCell className="text-right text-muted-foreground">12%</TableCell>
            <TableCell className="text-right font-medium text-destructive">
              - {formatCurrency(result.pf_employee)}
            </TableCell>
          </TableRow>
          
          <TableRow>
            <TableCell>
              <p className="font-medium text-foreground">Provident Fund (PF) - Employer</p>
              <p className="text-xs text-muted-foreground mt-0.5">Employer contribution</p>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="font-normal text-muted-foreground bg-background">
                12% of Basic
              </Badge>
            </TableCell>
            <TableCell className="text-right text-muted-foreground">12%</TableCell>
            <TableCell className="text-right font-medium text-muted-foreground">
              {formatCurrency(result.pf_employer)} <span className="text-xs opacity-60">(Not deducted from Gross)</span>
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell>
              <p className="font-medium text-foreground">Professional Tax</p>
              <p className="text-xs text-muted-foreground mt-0.5">Statutory state tax</p>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="font-normal text-muted-foreground bg-background">
                Fixed Amount
              </Badge>
            </TableCell>
            <TableCell className="text-right text-muted-foreground">-</TableCell>
            <TableCell className="text-right font-medium text-destructive">
              - {formatCurrency(result.professional_tax)}
            </TableCell>
          </TableRow>

          <TableRow className="bg-muted/10 hover:bg-muted/10">
            <TableCell colSpan={3} className="font-semibold text-foreground text-right border-t">
              Total Deductions
            </TableCell>
            <TableCell className="text-right font-bold text-destructive text-base border-t">
              - {formatCurrency(result.total_deductions)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      
      <div className="p-6 bg-primary/5 flex items-center justify-between border-t border-primary/20">
        <div>
          <h4 className="text-lg font-bold text-primary">Net Payable Salary</h4>
          <p className="text-sm text-primary/80">Gross Earnings minus Total Deductions</p>
        </div>
        <div className="text-3xl font-bold text-primary tracking-tight">
          {formatCurrency(result.net_salary)}
        </div>
      </div>
    </div>
  );
}
