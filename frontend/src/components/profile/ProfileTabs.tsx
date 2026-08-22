import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { EmployeeProfile } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { ResumeTab } from './ResumeTab';
import { PrivateInfoTab } from './PrivateInfoTab';
import { AboutTab } from './AboutTab';
import { SecurityTab } from './SecurityTab';
import { SalaryInfoTab } from '../salary/SalaryInfoTab';

interface ProfileTabsProps {
  employee: EmployeeProfile;
}

export function ProfileTabs({ employee }: ProfileTabsProps) {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isSelf = user?.id === employee.user_id;
  
  const tabs = [
    { id: 'resume', label: 'Resume' },
    { id: 'private', label: 'Private Info' },
  ];

  // Salary is Admin only, not visible to self unless self is Admin (but typically HR views others)
  if (isAdmin) {
    tabs.push({ id: 'salary', label: 'Salary Info' });
  }

  tabs.push({ id: 'about', label: 'About' });
  
  // Security is for self or admin
  if (isSelf || isAdmin) {
    tabs.push({ id: 'security', label: 'Security' });
  }

  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div className="flex flex-col md:flex-row gap-8 pt-8">
      {/* Left Sidebar Navigation */}
      <nav className="flex md:flex-col gap-1 w-full md:w-48 shrink-0 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium rounded-md text-left transition-colors whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-primary/10 text-primary" 
                : "text-foreground/70 hover:bg-secondary/80 hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      
      {/* Tab Content Area */}
      <div className="flex-1 min-w-0 bg-card border rounded-lg p-6 shadow-sm">
        {activeTab === 'resume' && <ResumeTab employee={employee} />}
        {activeTab === 'private' && <PrivateInfoTab employee={employee} />}
        {activeTab === 'salary' && <SalaryInfoTab employee={employee} />}
        {activeTab === 'about' && <AboutTab employee={employee} />}
        {activeTab === 'security' && <SecurityTab employee={employee} />}
      </div>
    </div>
  );
}
