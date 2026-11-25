import apiClient from './api';
import {
  ApiResponse,
  Resident,
  Vital,
  User,
  DashboardCounters,
  Band,
  BandCounters,
  RadarPod,
  RadarPodCounters,
  ChestPatch,
  ChestPatchCounters,
  FallIncident,
  FallCounters,
  Floor,
  RoomZone,
  Beacon,
  BeaconCounters,
  ResidentPresence,
  FacilityGeoJson,
} from '../types';

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

  async createResident(data: Partial<Resident> & Record<string, any>): Promise<Resident> {
    const response = await apiClient.post<ApiResponse<Resident>>('/residents', data);
    return response.data.data;
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

  async simulateScenario(residentId: number, conditionType: number): Promise<Vital> {
    return this.simulateVitals(residentId, conditionType);
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
      this.getRecentVitals(10).catch(() => ({ data: [], total: 0 })),
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

  // ==========================================
  // Hardware Bands & Pod Fleet API
  // ==========================================
  async getBands(params?: {
    skip?: number;
    limit?: number;
    status?: string;
    search?: string;
    residentId?: number;
  }): Promise<{ data: Band[]; total: number }> {
    const response = await apiClient.get<ApiResponse<Band[]>>('/bands', {
      params: {
        skip: params?.skip ?? 0,
        limit: params?.limit ?? 50,
        status: params?.status,
        search: params?.search,
        residentId: params?.residentId,
      },
    });

    return {
      data: response.data.data || [],
      total: response.data.pagination?.total ?? response.data.data?.length ?? 0,
    };
  },

  async getBandCounters(): Promise<BandCounters | null> {
    try {
      const response = await apiClient.get<ApiResponse<BandCounters>>('/bands/counters');
      return response.data.data;
    } catch {
      return null;
    }
  },

  async getBand(id: number): Promise<Band | null> {
    try {
      const response = await apiClient.get<ApiResponse<Band>>(`/bands/${id}`);
      return response.data.data;
    } catch {
      return null;
    }
  },

  async assignBand(bandId: number, residentId: number | null): Promise<Band> {
    const response = await apiClient.post<ApiResponse<Band>>(`/bands/${bandId}/assign`, {
      residentId,
    });
    return response.data.data;
  },

  async unassignBand(bandId: number): Promise<Band> {
    const response = await apiClient.post<ApiResponse<Band>>(`/bands/${bandId}/unassign`);
    return response.data.data;
  },

  async createBand(data: Partial<Band>): Promise<Band> {
    const response = await apiClient.post<ApiResponse<Band>>('/bands', data);
    return response.data.data;
  },

  async updateBand(bandId: number, data: Partial<Band>): Promise<Band> {
    const response = await apiClient.patch<ApiResponse<Band>>(`/bands/${bandId}`, data);
    return response.data.data;
  },

  async deleteBand(bandId: number): Promise<boolean> {
    const response = await apiClient.delete<ApiResponse<null>>(`/bands/${bandId}`);
    return response.data.code === 200;
  },

  // ==========================================
  // Radar Pods Hardware Fleet API
  // ==========================================
  async getRadarPods(params?: {
    skip?: number;
    limit?: number;
    status?: string;
    search?: string;
    residentId?: number;
  }): Promise<{ data: RadarPod[]; total: number }> {
    try {
      const response = await apiClient.get<ApiResponse<RadarPod[]>>('/radar-pods', {
        params: {
          skip: params?.skip ?? 0,
          limit: params?.limit ?? 50,
          status: params?.status,
          search: params?.search,
          residentId: params?.residentId,
        },
      });

      return {
        data: response.data.data || [],
        total: response.data.pagination?.total ?? response.data.data?.length ?? 0,
      };
    } catch {
      return { data: [], total: 0 };
    }
  },

  async getRadarPodCounters(): Promise<RadarPodCounters | null> {
    try {
      const response = await apiClient.get<ApiResponse<RadarPodCounters>>('/radar-pods/counters');
      return response.data.data;
    } catch {
      return null;
    }
  },

  async getRadarPod(id: number): Promise<RadarPod | null> {
    try {
      const response = await apiClient.get<ApiResponse<RadarPod>>(`/radar-pods/${id}`);
      return response.data.data;
    } catch {
      return null;
    }
  },

  async assignRadarPod(
    podId: number,
    residentId: number | null,
    roomNumber?: string,
  ): Promise<RadarPod> {
    const response = await apiClient.post<ApiResponse<RadarPod>>(`/radar-pods/${podId}/assign`, {
      residentId,
      roomNumber,
    });
    return response.data.data;
  },

  async unassignRadarPod(podId: number): Promise<RadarPod> {
    const response = await apiClient.post<ApiResponse<RadarPod>>(`/radar-pods/${podId}/unassign`);
    return response.data.data;
  },

  async createRadarPod(data: Partial<RadarPod>): Promise<RadarPod> {
    const response = await apiClient.post<ApiResponse<RadarPod>>('/radar-pods', data);
    return response.data.data;
  },

  async updateRadarPod(podId: number, data: Partial<RadarPod>): Promise<RadarPod> {
    const response = await apiClient.patch<ApiResponse<RadarPod>>(`/radar-pods/${podId}`, data);
    return response.data.data;
  },

  async deleteRadarPod(podId: number): Promise<boolean> {
    const response = await apiClient.delete<ApiResponse<null>>(`/radar-pods/${podId}`);
    return response.data.code === 200;
  },

  // ==========================================
  // Chest Patches Hardware Fleet API
  // ==========================================
  async getChestPatches(params?: {
    skip?: number;
    limit?: number;
    status?: string;
    search?: string;
    residentId?: number;
  }): Promise<{ data: ChestPatch[]; total: number }> {
    try {
      const response = await apiClient.get<ApiResponse<ChestPatch[]>>('/chest-patches', {
        params: {
          skip: params?.skip ?? 0,
          limit: params?.limit ?? 50,
          status: params?.status,
          search: params?.search,
          residentId: params?.residentId,
        },
      });

      return {
        data: response.data.data || [],
        total: response.data.pagination?.total ?? response.data.data?.length ?? 0,
      };
    } catch {
      return { data: [], total: 0 };
    }
  },

  async getChestPatchCounters(): Promise<ChestPatchCounters | null> {
    try {
      const response = await apiClient.get<ApiResponse<ChestPatchCounters>>('/chest-patches/counters');
      return response.data.data;
    } catch {
      return null;
    }
  },

  async getChestPatch(id: number): Promise<ChestPatch | null> {
    try {
      const response = await apiClient.get<ApiResponse<ChestPatch>>(`/chest-patches/${id}`);
      return response.data.data;
    } catch {
      return null;
    }
  },

  async assignChestPatch(patchId: number, residentId: number | null): Promise<ChestPatch> {
    const response = await apiClient.post<ApiResponse<ChestPatch>>(`/chest-patches/${patchId}/assign`, {
      residentId,
    });
    return response.data.data;
  },

  async unassignChestPatch(patchId: number): Promise<ChestPatch> {
    const response = await apiClient.post<ApiResponse<ChestPatch>>(`/chest-patches/${patchId}/unassign`);
    return response.data.data;
  },

  async createChestPatch(data: Partial<ChestPatch>): Promise<ChestPatch> {
    const response = await apiClient.post<ApiResponse<ChestPatch>>('/chest-patches', data);
    return response.data.data;
  },

  async updateChestPatch(patchId: number, data: Partial<ChestPatch>): Promise<ChestPatch> {
    const response = await apiClient.patch<ApiResponse<ChestPatch>>(`/chest-patches/${patchId}`, data);
    return response.data.data;
  },

  async deleteChestPatch(patchId: number): Promise<boolean> {
    const response = await apiClient.delete<ApiResponse<null>>(`/chest-patches/${patchId}`);
    return response.data.code === 200;
  },

  // ==========================================
  // Fall Detection & Emergency Dispatch API
  // ==========================================
  async getLatestUnresolvedFall(residentId?: number): Promise<FallIncident | null> {
    try {
      const response = await apiClient.get<ApiResponse<FallIncident | null>>('/falls/latest-unresolved', {
        params: residentId ? { residentId } : undefined,
      });
      return response.data.data;
    } catch {
      return null;
    }
  },

  async getFalls(params?: {
    skip?: number;
    limit?: number;
    residentId?: number;
    status?: string;
  }): Promise<{ data: FallIncident[]; total: number }> {
    const response = await apiClient.get<ApiResponse<FallIncident[]>>('/falls', {
      params: {
        skip: params?.skip ?? 0,
        limit: params?.limit ?? 50,
        residentId: params?.residentId,
        status: params?.status,
      },
    });

    return {
      data: response.data.data || [],
      total: response.data.pagination?.total ?? response.data.data?.length ?? 0,
    };
  },

  async getFallCounters(): Promise<FallCounters | null> {
    try {
      const response = await apiClient.get<ApiResponse<FallCounters>>('/falls/counters');
      return response.data.data;
    } catch {
      return null;
    }
  },

  async resolveFall(
    id: number,
    data: {
      status: 'resolved_false_alarm' | 'resolved_assisted' | 'emergency_dispatched';
      resolvedBy?: string;
      resolutionNotes?: string;
    }
  ): Promise<FallIncident> {
    const response = await apiClient.post<ApiResponse<FallIncident>>(`/falls/${id}/resolve`, data);
    return response.data.data;
  },

  async recordFall(data: Partial<FallIncident>): Promise<FallIncident> {
    const response = await apiClient.post<ApiResponse<FallIncident>>('/falls', data);
    return response.data.data;
  },

  // ==========================================
  // Facility Indoor Map, Floors & Zones API
  // ==========================================
  async getFacilityFloors(): Promise<Floor[]> {
    try {
      const response = await apiClient.get<ApiResponse<Floor[]>>('/facility/floors');
      return response.data.data || [];
    } catch {
      return [];
    }
  },

  async createFloor(data: Partial<Floor>): Promise<Floor> {
    const response = await apiClient.post<ApiResponse<Floor>>('/facility/floors', data);
    return response.data.data;
  },

  async updateFloor(id: number, data: Partial<Floor>): Promise<Floor> {
    const response = await apiClient.put<ApiResponse<Floor>>(`/facility/floors/${id}`, data);
    return response.data.data;
  },

  async deleteFloor(id: number): Promise<boolean> {
    const response = await apiClient.delete<ApiResponse<any>>(`/facility/floors/${id}`);
    return response.data.code === 200;
  },

  async getRoomZones(floorId?: number): Promise<RoomZone[]> {
    try {
      const response = await apiClient.get<ApiResponse<RoomZone[]>>('/facility/zones', {
        params: floorId ? { floorId } : undefined,
      });
      return response.data.data || [];
    } catch {
      return [];
    }
  },

  async createRoomZone(data: Partial<RoomZone>): Promise<RoomZone> {
    const response = await apiClient.post<ApiResponse<RoomZone>>('/facility/zones', data);
    return response.data.data;
  },

  async updateRoomZone(id: number, data: Partial<RoomZone>): Promise<RoomZone> {
    const response = await apiClient.put<ApiResponse<RoomZone>>(`/facility/zones/${id}`, data);
    return response.data.data;
  },

  async deleteRoomZone(id: number): Promise<boolean> {
    const response = await apiClient.delete<ApiResponse<any>>(`/facility/zones/${id}`);
    return response.data.code === 200;
  },

  // ==========================================
  // BLE Beacons Management & Fleet API
  // ==========================================
  async getBeacons(): Promise<Beacon[]> {
    try {
      const response = await apiClient.get<ApiResponse<Beacon[]>>('/facility/beacons');
      return response.data.data || [];
    } catch {
      return [];
    }
  },

  async getBeaconCounters(): Promise<BeaconCounters | null> {
    try {
      const response = await apiClient.get<ApiResponse<BeaconCounters>>('/facility/beacons/counters');
      return response.data.data;
    } catch {
      return null;
    }
  },

  async createBeacon(data: Partial<Beacon>): Promise<Beacon> {
    const response = await apiClient.post<ApiResponse<Beacon>>('/facility/beacons', data);
    return response.data.data;
  },

  async updateBeacon(id: number, data: Partial<Beacon>): Promise<Beacon> {
    const response = await apiClient.put<ApiResponse<Beacon>>(`/facility/beacons/${id}`, data);
    return response.data.data;
  },

  async assignBeacon(id: number, zoneId: number | null): Promise<Beacon> {
    const response = await apiClient.post<ApiResponse<Beacon>>(`/facility/beacons/${id}/assign`, {
      zoneId,
    });
    return response.data.data;
  },

  async deleteBeacon(id: number): Promise<boolean> {
    const response = await apiClient.delete<ApiResponse<any>>(`/facility/beacons/${id}`);
    return response.data.code === 200;
  },

  // ==========================================
  // Presence & Movement Simulation
  // ==========================================
  async getFacilityPresence(): Promise<ResidentPresence[]> {
    try {
      const response = await apiClient.get<ApiResponse<ResidentPresence[]>>('/facility/presence');
      return response.data.data || [];
    } catch {
      return [];
    }
  },

  async getFacilityGeoJson(floorNumber?: number): Promise<FacilityGeoJson | null> {
    try {
      const response = await apiClient.get<ApiResponse<FacilityGeoJson>>('/facility/geojson', {
        params: floorNumber ? { floorNumber } : undefined,
      });
      return response.data.data || null;
    } catch {
      return null;
    }
  },

  async simulateResidentMovement(residentId: number, targetZoneId: number): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/facility/simulate-movement', {
      residentId,
      targetZoneId,
    });
    return response.data.data;
  },
};

export default commandCenterService;
