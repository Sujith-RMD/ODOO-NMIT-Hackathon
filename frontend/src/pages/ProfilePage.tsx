import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { employeeService } from '../services/employeeService';
import { useAuthStore } from '../store/authStore';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileTabs } from '../components/profile/ProfileTabs';
import { Skeleton } from '../components/ui/skeleton';

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  
  // If no ID is provided, assume it's "My Profile"
  const employeeId = id ? parseInt(id, 10) : user?.id;

  useEffect(() => {
    if (!isAuthenticated || !employeeId) {
      navigate('/login');
    }
  }, [isAuthenticated, employeeId, navigate]);

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => employeeService.getById(employeeId!),
    enabled: !!employeeId,
  });

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b">
          <Skeleton className="h-28 w-28 rounded-full" />
          <div className="flex-1 flex flex-col items-center sm:items-start gap-3 mt-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-4 mt-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8 pt-8">
          <div className="flex md:flex-col gap-2 w-full md:w-48 shrink-0">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-foreground">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <ProfileHeader employee={employee} />
      <ProfileTabs employee={employee} />
    </div>
  );
}
