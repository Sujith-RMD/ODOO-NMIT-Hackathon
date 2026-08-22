import { api } from './api';
import { TimeOffRequest, TimeOffBalance, TimeOffRequestCreate, PaginatedResponse } from '../types';

export const timeOffService = {
  getMyRequests: async (): Promise<PaginatedResponse<TimeOffRequest>> => {
    try {
      const response = await api.get('/time-off/me');
      return response.data;
    } catch (error) {
      console.warn('Backend get my time-off failed, using mock.', error);
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        items: [
          {
            id: 1,
            employee_id: 1,
            time_off_type_id: 1,
            start_date: '2024-11-20',
            end_date: '2024-11-22',
            total_days: 3,
            reason: 'Vacation',
            status: 'approved',
            approved_by_id: 2,
            approved_at: new Date().toISOString(),
            rejection_reason: null,
            attachment_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            employee: null,
            approver: null,
            time_off_type: {
              id: 1,
              name: 'Paid Time Off',
              description: '',
              is_paid: true,
              color: '#3B82F6',
              created_at: new Date().toISOString()
            }
          }
        ],
        total: 1,
        page: 1,
        page_size: 20,
        total_pages: 1
      };
    }
  },

  getAllRequests: async (): Promise<PaginatedResponse<TimeOffRequest>> => {
    try {
      const response = await api.get('/time-off/admin/requests');
      return response.data;
    } catch (error) {
      console.warn('Backend get all time-off failed, using mock.', error);
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        items: [
          {
            id: 2,
            employee_id: 3,
            time_off_type_id: 2,
            start_date: '2024-12-01',
            end_date: '2024-12-02',
            total_days: 2,
            reason: 'Sick leave',
            status: 'pending',
            approved_by_id: null,
            approved_at: null,
            rejection_reason: null,
            attachment_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            employee: {
              id: 3,
              first_name: 'Bob',
              last_name: 'Wilson',
              full_name: 'Bob Wilson',
              initials: 'BW',
              email: 'bob@example.com'
            } as any,
            approver: null,
            time_off_type: {
              id: 2,
              name: 'Sick Leave',
              description: '',
              is_paid: true,
              color: '#EF4444',
              created_at: new Date().toISOString()
            }
          }
        ],
        total: 1,
        page: 1,
        page_size: 20,
        total_pages: 1
      };
    }
  },

  getBalances: async (): Promise<TimeOffBalance[]> => {
    try {
      const response = await api.get('/time-off/balances');
      return response.data;
    } catch (error) {
      console.warn('Backend get balances failed, using mock.', error);
      await new Promise(resolve => setTimeout(resolve, 300));
      return [
        {
          time_off_type: { id: 1, name: 'Paid Time Off', description: '', is_paid: true, color: '#3B82F6', created_at: '' },
          allocated_days: 24,
          used_days: 10,
          carry_over_days: 0,
          available_days: 14
        },
        {
          time_off_type: { id: 2, name: 'Sick Leave', description: '', is_paid: true, color: '#EF4444', created_at: '' },
          allocated_days: 12,
          used_days: 5,
          carry_over_days: 0,
          available_days: 7
        }
      ];
    }
  },

  createRequest: async (data: TimeOffRequestCreate): Promise<TimeOffRequest> => {
    try {
      const response = await api.post('/time-off/requests', data);
      return response.data;
    } catch (error) {
      console.warn('Backend create time-off request failed, using mock.', error);
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        id: 999,
        employee_id: 1,
        time_off_type_id: data.time_off_type_id,
        start_date: data.start_date,
        end_date: data.end_date,
        total_days: 1, // simplified
        reason: data.reason || null,
        status: 'pending',
        approved_by_id: null,
        approved_at: null,
        rejection_reason: null,
        attachment_url: data.attachment_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        employee: null,
        approver: null,
        time_off_type: {
          id: data.time_off_type_id,
          name: data.time_off_type_id === 1 ? 'Paid Time Off' : 'Sick Leave',
          description: '',
          is_paid: true,
          color: '#3B82F6',
          created_at: new Date().toISOString()
        }
      };
    }
  },

  approveRequest: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await api.post(`/time-off/admin/requests/${id}/approve`);
      return response.data;
    } catch (error) {
      console.warn('Backend approve time-off failed, using mock.', error);
      await new Promise(resolve => setTimeout(resolve, 300));
      return { message: 'Approved successfully (mock)' };
    }
  },

  rejectRequest: async (id: number, reason?: string): Promise<{ message: string }> => {
    try {
      const response = await api.post(`/time-off/admin/requests/${id}/reject`, { reason });
      return response.data;
    } catch (error) {
      console.warn('Backend reject time-off failed, using mock.', error);
      await new Promise(resolve => setTimeout(resolve, 300));
      return { message: 'Rejected successfully (mock)' };
    }
  }
};
