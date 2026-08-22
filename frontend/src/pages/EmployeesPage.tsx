import React, { useState, useEffect } from 'react';
import { employeeService } from '../services/employeeService';
import { EmployeeCard as EmployeeCardType } from '../types';
import { EmployeeSearchBar } from '../components/employees/EmployeeSearchBar';
import { EmployeeGrid } from '../components/employees/EmployeeGrid';

export function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeCardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading(true);
      try {
        const data = await employeeService.getAll({ search: debouncedSearch });
        setEmployees(data.items);
      } catch (error) {
        console.error('Failed to load employees', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEmployees();
  }, [debouncedSearch]);

  const handleAddEmployee = () => {
    // In a real app, open a modal or navigate to /employees/new
    alert("Add employee flow out of scope for hackathon (unless via API)");
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-page-title mb-1">Directory</h1>
        <p className="text-muted">Find and connect with people in your organization.</p>
      </div>

      <EmployeeSearchBar 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm} 
        onAddClick={handleAddEmployee} 
      />
      
      <EmployeeGrid employees={employees} isLoading={isLoading} />
    </div>
  );
}
