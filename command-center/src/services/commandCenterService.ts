import apiClient from './api';
import { ApiResponse, Resident, Vital, User, DashboardCounters } from '../types';

export const commandCenterService = {
  // ==========================================
  // Residents API
  // ==========================================
  async getResidents(params?: { skip?: number; limit?: number; search?: string }): Promise<{
    data: Resident[];
    total: number;
  }> {
    const response = await apiClient.get<ApiResponse<Resident[]>>('/residents', {
      params: {
        skip: params?.skip ?? 0,
        limit: params?.limit ?? 50,
      },
    });

    return {
      data: response.data.data || [],
      total: response.data.pagination?.total ?? response.data.data?.length ?? 0,
    };
  },

  async getResidentCounters(): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/residents/counters');
      return response.data.data;
    } catch {
      return null;
    }
  },

  // ==========================================
  // Vitals API
  // ==========================================
  async getVitals(params?: {
    skip?: number;
    limit?: number;
    residentId?: number;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: number;
  }): Promise<{ data: Vital[]; total: number }> {
    const response = await apiClient.get<ApiResponse<Vital[]>>('/vitals', {
      params: {
        skip: params?.skip ?? 0,
        limit: params?.limit ?? 20,
        residentId: params?.residentId,
        startDate: params?.startDate,
        endDate: params?.endDate,
        sortBy: params?.sortBy ?? 'generatedAt',
        sortOrder: params?.sortOrder ?? -1,
      },
    });

    return {
      data: response.data.data || [],
      total: response.data.pagination?.total ?? response.data.data?.length ?? 0,
    };
  },

  async getRecentVitals(limit: number = 10): Promise<{ data: Vital[]; total: number }> {
    return this.getVitals({
      skip: 0,
      limit,
      sortBy: 'generatedAt',
      sortOrder: -1,
    });
  },

  // ==========================================
  // Users API
  // ==========================================
  async getUsers(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    roleId?: number;
  }): Promise<{ data: User[]; total: number }> {
    const response = await apiClient.get<ApiResponse<User[]>>('/users', {
      params: {
        skip: params?.skip ?? 0,
        limit: params?.limit ?? 50,
        search: params?.search,
        roleId: params?.roleId,
      },
    });

    return {
      data: response.data.data || [],
      total: response.data.pagination?.total ?? response.data.data?.length ?? 0,
    };
  },

  async getUserCounters(): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/users/counters');
      return response.data.data;
    } catch {
      return null;
    }
  },

  // ==========================================
  // Simulation API
  // ==========================================
  async simulateVitals(residentId: number, conditionType: number): Promise<Vital> {
    const response = await apiClient.post<ApiResponse<Vital>>('/simulations', {
      residentId,
      conditionType,
    });
    return response.data.data;
  },

  // ==========================================
  // Combined Dashboard Overview
  // ==========================================
  async getDashboardSummary(): Promise<{
    counters: DashboardCounters;
    recentVitals: Vital[];
    residents: Resident[];
    residentsMap: Record<number, Resident>;
  }> {
    // Concurrently fetch counts & data
    const [residentsRes, vitalsRes, usersRes] = await Promise.all([
      this.getResidents({ skip: 0, limit: 100 }).catch(() => ({ data: [], total: 0 })),
      this.getRecentVitals(15).catch(() => ({ data: [], total: 0 })),
      this.getUsers({ skip: 0, limit: 100 }).catch(() => ({ data: [], total: 0 })),
    ]);

    // Build residents lookup map for quick vital -> resident name mapping
    const residentsMap: Record<number, Resident> = {};
    for (const resident of residentsRes.data) {
      residentsMap[resident.id] = resident;
    }

    const activeResidents = residentsRes.data.filter((r) => r.status === 1).length;
    const activeUsers = usersRes.data.filter((u) => u.isActive).length;

    const counters: DashboardCounters = {
      residentsTotal: residentsRes.total,
      residentsActive: activeResidents || residentsRes.total,
      vitalsTotal: vitalsRes.total,
      vitalsRecentCount: vitalsRes.data.length,
      usersTotal: usersRes.total,
      usersActive: activeUsers || usersRes.total,
      lastUpdated: new Date(),
    };

    return {
      counters,
      recentVitals: vitalsRes.data,
      residents: residentsRes.data,
      residentsMap,
    };
  },
};

export default commandCenterService;
