import React from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useAuthStore } from '../../store/authStore';

interface EmployeeSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddClick?: () => void;
}

export function EmployeeSearchBar({ searchTerm, onSearchChange, onAddClick }: EmployeeSearchBarProps) {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between w-full">
      <div className="relative w-full sm:max-w-md">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
          <Search className="h-4 w-4" />
        </div>
        <Input
          type="text"
          placeholder="Search by name, ID, or department..."
          className="pl-9 h-10 w-full bg-white"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      {isAdmin && (
        <Button onClick={onAddClick} className="w-full sm:w-auto h-10 px-5" variant="default">
          <Plus className="mr-2 h-4 w-4" />
          New Employee
        </Button>
      )}
    </div>
  );
}
