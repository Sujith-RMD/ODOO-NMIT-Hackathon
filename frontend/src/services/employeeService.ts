import { api } from './api';
import { EmployeeCard, EmployeeProfile, EmployeeCreateRequest, PaginatedResponse } from '../types';

// Mock data
const MOCK_EMPLOYEE_CARDS: EmployeeCard[] = [
  {
    id: 1,
    full_name: 'John Doe',
    initials: 'JD',
    avatar_url: null,
    department: 'Engineering',
    position: 'Senior Developer',
    login_id: 'OIDO20240001',
    status: 'present',
  },
  {
    id: 2,
    full_name: 'Jane Smith',
    initials: 'JS',
    avatar_url: null,
    department: 'HR',
    position: 'HR Manager',
    login_id: 'OISM20240002',
    status: 'on_leave',
  },
  {
    id: 3,
    full_name: 'Bob Wilson',
    initials: 'BW',
    avatar_url: null,
    department: 'Sales',
    position: 'Sales Executive',
    login_id: 'OIWI20240003',
    status: 'absent',
  },
];

const MOCK_EMPLOYEE_PROFILE: EmployeeProfile = {
  id: 1,
  user_id: 1,
  login_id: 'OIDO20240001',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@company.com',
  phone: '+1 234 567 8900',
  department: 'Engineering',
  position: 'Senior Developer',
  manager_id: 2,
  location: 'New York',
  date_of_joining: '2024-01-15',
  date_of_birth: '1990-05-20',
  address: '123 Tech Lane, NY 10001',
  nationality: 'American',
  gender: 'Male',
  marital_status: 'Single',
  personal_email: 'john.personal@email.com',
  bank_account_number: '1234567890',
  bank_name: 'Tech Bank',
  ifsc_code: 'TECH0001234',
  pan_number: 'ABCDE1234F',
  uan_number: '100020003000',
  employee_code: 'EMP-001',
  avatar_url: null,
  status: 'active',
  full_name: 'John Doe',
  initials: 'JD',
  about: 'Passionate frontend developer with 5+ years of experience in React and TypeScript.',
  interests: 'Photography, Hiking, Open Source',
  skills: 'React, TypeScript, Tailwind CSS, Node.js',
  certifications: 'AWS Certified Developer',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user: null,
  manager: null, // Would be an Employee object
  subordinates_count: 0,
  attendance_today: {
    id: 1,
    employee_id: 1,
    date: new Date().toISOString().split('T')[0],
    check_in: '09:00:00',
    check_out: null,
    work_hours: 0,
    extra_hours: 0,
    status: 'present',
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  time_off_balances: [
    {
      id: 1,
      employee_id: 1,
      time_off_type_id: 1,
      year: new Date().getFullYear(),
      allocated_days: 20,
      used_days: 5,
      carry_over_days: 2,
      available_days: 17,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      time_off_type: {
        id: 1,
        name: 'Paid Time Off',
        description: 'Standard paid leave',
        is_paid: true,
        color: '#3B82F6',
        created_at: new Date().toISOString(),
      }
    },
    {
      id: 2,
      employee_id: 1,
      time_off_type_id: 2,
      year: new Date().getFullYear(),
      allocated_days: 10,
      used_days: 2,
      carry_over_days: 0,
      available_days: 8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      time_off_type: {
        id: 2,
        name: 'Sick Leave',
        description: 'Medical leave',
        is_paid: true,
        color: '#EF4444',
        created_at: new Date().toISOString(),
      }
    }
  ]
};


export const employeeService = {
  getAll: async (params?: { search?: string, department?: string }): Promise<PaginatedResponse<EmployeeCard>> => {
    try {
      const response = await api.get('/employees', { params });
      return response.data;
    } catch (error) {
      console.warn('Backend get employees failed, using mock data.', error);
      await new Promise(resolve => setTimeout(resolve, 300));
      let filtered = [...MOCK_EMPLOYEE_CARDS];
      if (params?.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(e => e.full_name.toLowerCase().includes(s) || e.department?.toLowerCase().includes(s));
      }
      return {
        items: filtered,
        total: filtered.length,
        page: 1,
        page_size: 20,
        total_pages: 1
      };
    }
  },

  getById: async (id: number): Promise<EmployeeProfile> => {
    try {
      const response = await api.get(`/employees/${id}`);
      return response.data;
    } catch (error) {
      console.warn('Backend get employee profile failed, using mock data.', error);
      await new Promise(resolve => setTimeout(resolve, 300));
      return { ...MOCK_EMPLOYEE_PROFILE, id, full_name: `Mock Employee ${id}` };
    }
  },

  create: async (data: EmployeeCreateRequest): Promise<EmployeeProfile> => {
    try {
      const response = await api.post('/employees', data);
      return response.data;
    } catch (error) {
      console.warn('Backend create employee failed, using mock data.', error);
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        ...MOCK_EMPLOYEE_PROFILE,
        id: 999,
        full_name: `${data.first_name} ${data.last_name}`,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        login_id: 'OINEW20240001'
      };
    }
  },
  
  update: async (id: number, data: Partial<EmployeeCreateRequest>): Promise<EmployeeProfile> => {
    try {
      const response = await api.put(`/employees/${id}`, data);
      return response.data;
    } catch (error) {
      console.warn('Backend update employee failed, using mock data.', error);
      await new Promise(resolve => setTimeout(resolve, 500));
      return { ...MOCK_EMPLOYEE_PROFILE, id, ...data } as EmployeeProfile;
    }
  }
};
