import React from 'react';
import { EmployeeProfile } from '../../types';

export function PrivateInfoTab({ employee }: { employee: EmployeeProfile }) {
  const DataRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 py-3 border-b border-border/50 last:border-0">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground sm:col-span-2">{value || '-'}</dd>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">Contact & Position</h3>
        <dl className="bg-white">
          <DataRow label="Job Position" value={employee.position} />
          <DataRow label="Department" value={employee.department} />
          <DataRow label="Manager" value={employee.manager?.full_name} />
          <DataRow label="Location" value={employee.location} />
          <DataRow label="Personal Email" value={employee.personal_email} />
          <DataRow label="Date of Joining" value={employee.date_of_joining} />
        </dl>
      </div>

      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">Personal Information</h3>
        <dl className="bg-white">
          <DataRow label="Residing Address" value={employee.address} />
          <DataRow label="Date of Birth" value={employee.date_of_birth} />
          <DataRow label="Nationality" value={employee.nationality} />
          <DataRow label="Gender" value={employee.gender} />
          <DataRow label="Marital Status" value={employee.marital_status} />
        </dl>
      </div>

      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">Bank Details</h3>
        <dl className="bg-white">
          <DataRow label="Account Number" value={employee.bank_account_number} />
          <DataRow label="Bank Name" value={employee.bank_name} />
          <DataRow label="IFSC Code" value={employee.ifsc_code} />
          <DataRow label="UAN No" value={employee.uan_number} />
          <DataRow label="PAN No" value={employee.pan_number} />
          <DataRow label="Emp Code" value={employee.employee_code} />
        </dl>
      </div>
    </div>
  );
}
