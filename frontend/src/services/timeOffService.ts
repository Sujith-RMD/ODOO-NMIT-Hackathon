import { api } from './api';
import { TimeOffRequest, TimeOffBalance, TimeOffRequestCreate, PaginatedResponse } from '../types';

export const timeOffService = {
  getMyRequests: async (): Promise<PaginatedResponse<TimeOffRequest>> => {
    const response = await api.get('/time-off/my-requests');
    // Backend returns an array, frontend expects a PaginatedResponse structure
    const items = response.data;
    return {
      items,
      total: items.length,
      page: 1,
      page_size: items.length || 20,
      total_pages: 1
    };
  },

  getAllRequests: async (): Promise<PaginatedResponse<TimeOffRequest>> => {
    const response = await api.get('/time-off/admin/requests');
    const items = response.data;
    return {
      items,
      total: items.length,
      page: 1,
      page_size: items.length || 20,
      total_pages: 1
    };
  },

  getBalances: async (): Promise<TimeOffBalance[]> => {
    const response = await api.get('/time-off/my-balances');
    return response.data;
  },

  createRequest: async (data: TimeOffRequestCreate): Promise<TimeOffRequest> => {
    const response = await api.post('/time-off/request', data);
    return response.data;
  },

  approveRequest: async (id: number): Promise<{ message: string }> => {
    const response = await api.post(`/time-off/admin/requests/${id}/approve`);
    return response.data;
  },

  rejectRequest: async (id: number, reason?: string): Promise<{ message: string }> => {
    const endpoint = reason 
      ? `/time-off/admin/requests/${id}/reject?rejection_reason=${encodeURIComponent(reason)}`
      : `/time-off/admin/requests/${id}/reject?rejection_reason=Rejected`;
    const response = await api.post(endpoint);
    return response.data;
  }
};
