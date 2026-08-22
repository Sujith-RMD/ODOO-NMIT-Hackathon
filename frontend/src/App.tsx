import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { EmployeesPage } from './pages/EmployeesPage';
import { ProfilePage } from './pages/ProfilePage';
import { AttendancePage } from './pages/AttendancePage';
import { TimeOffPage } from './pages/TimeOffPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AddEmployeePage } from './pages/AddEmployeePage';
import { SalaryPage } from './pages/SalaryPage';
import { NotificationsPage } from './pages/NotificationsPage';

import { RequireAuth } from './components/auth/RequireAuth';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes — no auth required */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<Navigate to="/" replace />} />

          <Route element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }>
            {/* Protected routes */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/employees/new" element={<AddEmployeePage />} />
            <Route path="/employees/:id" element={<ProfilePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/time-off" element={<TimeOffPage />} />
            <Route path="/salary" element={<SalaryPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/employees" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
