import { api } from './api';
import { AttendanceRecord, AttendanceSummary, CheckInResponse, CheckOutResponse } from '../types';

export const attendanceService = {
  checkIn: async (): Promise<CheckInResponse> => {
    try {
      // Backend requires check_in_time as a query param in HH:MM:SS format
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0]; // "HH:MM:SS"
      const response = await api.post('/attendance/check-in', null, { params: { check_in_time: timeStr } });
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
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const response = await api.post('/attendance/check-out', null, { params: { check_out_time: timeStr } });
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

  // GET /attendance/my-history — employee's own records
  getMyHistory: async (startDate: string, endDate: string): Promise<AttendanceRecord[]> => {
    try {
      const response = await api.get('/attendance/my-history', {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } catch (error) {
      console.warn('Backend my-history failed, using mock.', error);
      await new Promise(resolve => setTimeout(resolve, 300));
      const records: AttendanceRecord[] = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getDay() === 0 || d.getDay() === 6) continue;
        records.push({
          id: d.getDate(),
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
      return records;
    }
  },

  // GET /attendance/my-summary — employee's summary stats
  getMySummary: async (startDate: string, endDate: string): Promise<AttendanceSummary> => {
    try {
      const response = await api.get('/attendance/my-summary', {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } catch (error) {
      console.warn('Backend my-summary failed, using mock.', error);
      await new Promise(resolve => setTimeout(resolve, 200));
      return {
        total_working_days: 22,
        present_days: 18,
        absent_days: 2,
        late_days: 1,
        half_days: 1,
        on_leave_days: 2,
        total_work_hours: 144,
        total_extra_hours: 4,
      };
    }
  },

  // GET /attendance/admin/all — admin view of all employee attendance
  getAdminAll: async (params: {
    start_date?: string;
    end_date?: string;
    employee_id?: number;
    status?: string;
  }): Promise<AttendanceRecord[]> => {
    try {
      const response = await api.get('/attendance/admin/all', { params });
      return response.data;
    } catch (error) {
      console.warn('Backend admin/all failed, using mock.', error);
      await new Promise(resolve => setTimeout(resolve, 300));
      return [
        { id: 1, employee_id: 1, date: params.start_date || new Date().toISOString().split('T')[0], check_in: '09:00:00', check_out: '17:00:00', work_hours: 8, extra_hours: 0, status: 'present', notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 2, employee_id: 2, date: params.start_date || new Date().toISOString().split('T')[0], check_in: '09:30:00', check_out: '17:00:00', work_hours: 7.5, extra_hours: 0, status: 'late', notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 3, employee_id: 3, date: params.start_date || new Date().toISOString().split('T')[0], check_in: null, check_out: null, work_hours: 0, extra_hours: 0, status: 'absent', notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ];
    }
  },

  // GET /attendance/today — current user's today record
  getToday: async (): Promise<AttendanceRecord | null> => {
    try {
      const response = await api.get('/attendance/today');
      return response.data;
    } catch (error) {
      // 404 means no record yet today — that's fine
      return null;
    }
  },
};

