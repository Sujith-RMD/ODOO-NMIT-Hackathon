import { api } from './api';
import { AttendanceRecord, AttendanceSummary, CheckInResponse, CheckOutResponse, PaginatedResponse } from '../types';

export const attendanceService = {
  checkIn: async (): Promise<CheckInResponse> => {
    try {
      const response = await api.post('/attendance/check-in');
      return response.data;
    } catch (error) {
      console.warn('Backend check-in failed, using mock.', error);
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        message: 'Checked in successfully (mock)',
        attendance: {
          id: 1,
          employee_id: 1,
          date: new Date().toISOString().split('T')[0],
          check_in: new Date().toLocaleTimeString([], { hour12: false }),
          check_out: null,
          work_hours: 0,
          extra_hours: 0,
          status: 'present',
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      };
    }
  },

  checkOut: async (): Promise<CheckOutResponse> => {
    try {
      const response = await api.post('/attendance/check-out');
      return response.data;
    } catch (error) {
      console.warn('Backend check-out failed, using mock.', error);
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        message: 'Checked out successfully (mock)',
        work_hours: 8,
        extra_hours: 0,
        attendance: {
          id: 1,
          employee_id: 1,
          date: new Date().toISOString().split('T')[0],
          check_in: '09:00:00',
          check_out: new Date().toLocaleTimeString([], { hour12: false }),
          work_hours: 8,
          extra_hours: 0,
          status: 'present',
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      };
    }
  },

  getMyAttendance: async (month?: number, year?: number): Promise<{ records: AttendanceRecord[], summary: AttendanceSummary }> => {
    try {
      const response = await api.get('/attendance/me', { params: { month, year } });
      return response.data;
    } catch (error) {
      console.warn('Backend get my attendance failed, using mock.', error);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const records: AttendanceRecord[] = [];
      const today = new Date();
      const currentMonth = month || today.getMonth() + 1;
      const currentYear = year || today.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      
      for(let i=1; i<=Math.min(today.getDate(), daysInMonth); i++) {
         const d = new Date(currentYear, currentMonth - 1, i);
         // skip weekends
         if (d.getDay() === 0 || d.getDay() === 6) continue;
         
         records.push({
          id: i,
          employee_id: 1,
          date: d.toISOString().split('T')[0],
          check_in: '09:00:00',
          check_out: '17:00:00',
          work_hours: 8,
          extra_hours: 0,
          status: 'present',
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
         });
      }

      return {
        records,
        summary: {
          total_working_days: 22,
          present_days: records.length,
          absent_days: 0,
          late_days: 0,
          half_days: 0,
          on_leave_days: 2,
          total_work_hours: records.length * 8,
          total_extra_hours: 0
        }
      };
    }
  },

  getAdminAttendance: async (date: string): Promise<PaginatedResponse<AttendanceRecord & { employee_name: string }>> => {
    try {
      const response = await api.get('/attendance/admin', { params: { date } });
      return response.data;
    } catch (error) {
      console.warn('Backend admin attendance failed, using mock.', error);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const items = [
        {
          id: 1,
          employee_id: 1,
          employee_name: 'John Doe',
          date,
          check_in: '09:00:00',
          check_out: '17:00:00',
          work_hours: 8,
          extra_hours: 0,
          status: 'present' as const,
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];

      return {
        items,
        total: 1,
        page: 1,
        page_size: 20,
        total_pages: 1
      };
    }
  }
};
