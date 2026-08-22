import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { employeeService } from '../services/employeeService';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { UserPlus, ChevronRight } from 'lucide-react';

/**
 * ════════════════════════════════════════════════════════════════
 * ADD EMPLOYEE PAGE  —  Route: /employees/new
 * ════════════════════════════════════════════════════════════════
 *
 * OWNER: [YOUR FRIEND]
 * ACCESS: Admin only
 *
 * WHAT THIS PAGE DOES:
 *   A multi-step form to create a new employee + auto-generate their login ID.
 *   After submission, navigate to the new employee's profile page.
 *
 * BACKEND ENDPOINT:
 *   POST /employees?password=<initial_password>
 *   Body (JSON): {
 *     first_name: string,
 *     last_name: string,
 *     email: string,            ← must be unique
 *     date_of_joining: string,  ← format "YYYY-MM-DD"
 *     department?: string,
 *     position?: string,
 *     phone?: string,
 *     manager_id?: number,
 *     location?: string,
 *   }
 *   Response: EmployeeResponse (includes id, login_id, full_name, etc.)
 *
 * AUTO-GENERATED LOGIN ID:
 *   The backend generates it automatically from:
 *   COMPANY_PREFIX + first2(first_name) + first2(last_name) + YY + serial
 *   e.g. OIJODO26001 — just show it to the admin after creation.
 *
 * MULTI-STEP FORM STRUCTURE:
 *   Step 1 — Basic Info:   first_name, last_name, email, date_of_joining
 *   Step 2 — Job Details:  department, position, location, manager_id
 *   Step 3 — Security:     initial password (sent as query param ?password=)
 *   Step 4 — Confirmation: show generated login_id, success message
 *
 * VALIDATION (use zod):
 *   import { z } from 'zod';
 *   const step1Schema = z.object({
 *     first_name: z.string().min(1),
 *     last_name: z.string().min(1),
 *     email: z.string().email(),
 *     date_of_joining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
 *   });
 *
 * MUTATION PATTERN:
 *   const mutation = useMutation({
 *     mutationFn: async (data: EmployeeCreateRequest) => {
 *       const response = await api.post(`/employees?password=${data.password}`, data);
 *       return response.data;
 *     },
 *     onSuccess: (newEmployee) => {
 *       queryClient.invalidateQueries({ queryKey: ['employees'] });
 *       navigate(`/employees/${newEmployee.id}`);
 *     },
 *   });
 *
 * FOR manager_id DROPDOWN:
 *   const { data } = useQuery({
 *     queryKey: ['employees'],
 *     queryFn: () => employeeService.getAll({}),
 *   });
 *   // then render data?.items as <option> elements
 *
 * DESIGN:
 *   - Use a numbered step indicator at the top
 *   - Card layout (white card, centered, max-w-xl)
 *   - Back/Next buttons at bottom
 * ════════════════════════════════════════════════════════════════
 */

export function AddEmployeePage() {
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 4;

  return (
    <div className="w-full max-w-2xl mx-auto animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">Add Employee</h1>
        <p className="text-sm text-muted-foreground">Create a new employee account and profile.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <React.Fragment key={i}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
              i + 1 <= step
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground'
            }`}>
              {i + 1}
            </div>
            {i < TOTAL_STEPS - 1 && (
              <div className={`flex-1 h-0.5 transition-colors ${
                i + 1 < step ? 'bg-primary' : 'bg-border'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* TODO: Implement each step's form fields */}
      <div className="bg-card border rounded-xl p-8 shadow-sm">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">Basic Information</h2>
            {/* TODO: first_name, last_name, email, date_of_joining inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                <Input placeholder="John" />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Work Email</Label>
              <Input type="email" placeholder="john@company.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Date of Joining</Label>
              <Input type="date" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">Job Details</h2>
            {/* TODO: department, position, location, manager_id */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Input placeholder="Engineering" />
              </div>
              <div className="space-y-1.5">
                <Label>Position</Label>
                <Input placeholder="Software Engineer" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input placeholder="Bengaluru" />
            </div>
            <div className="space-y-1.5">
              <Label>Manager</Label>
              {/* TODO: replace with a real dropdown from GET /employees */}
              <Input placeholder="Select manager (search by name)" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">Set Initial Password</h2>
            <p className="text-sm text-muted-foreground">
              This password will be sent to the employee. They can change it after first login.
            </p>
            <div className="space-y-1.5">
              <Label>Initial Password</Label>
              <Input type="password" placeholder="Min 8 characters" />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm Password</Label>
              <Input type="password" placeholder="Repeat password" />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center space-y-4 py-4">
            <div className="h-14 w-14 rounded-full bg-[#27AE60]/10 flex items-center justify-center mx-auto">
              <UserPlus className="h-7 w-7 text-[#27AE60]" />
            </div>
            <h2 className="text-lg font-semibold">Employee Created!</h2>
            <p className="text-sm text-muted-foreground">
              Their system-generated Login ID is:
            </p>
            {/* TODO: Show real login_id from mutation response */}
            <div className="bg-secondary rounded-lg px-4 py-2 inline-block font-mono text-lg font-bold text-primary">
              OIJODO26001
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Share this with the employee along with their initial password.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
          >
            Back
          </Button>
          {step < TOTAL_STEPS ? (
            <Button onClick={() => setStep(s => s + 1)}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={() => window.history.back()}>
              Go to Profile
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
