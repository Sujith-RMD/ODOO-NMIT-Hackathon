import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { employeeService } from '../services/employeeService';
import { EmployeeSearchBar } from '../components/employees/EmployeeSearchBar';
import { EmployeeGrid } from '../components/employees/EmployeeGrid';

export function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading } = useQuery({
    queryKey: ['employees', { search: debouncedSearch }],
    queryFn: () => employeeService.getAll({ search: debouncedSearch }),
  });

  const employees = data?.items || [];

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-page-title mb-1">Directory</h1>
        <p className="text-muted">Find and connect with people in your organization.</p>
      </div>

      <EmployeeSearchBar 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm} 
      />
      
      <EmployeeGrid employees={employees} isLoading={isLoading} />
    </div>
  );
}
