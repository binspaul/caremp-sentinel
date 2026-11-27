import axios from "axios";
import { VitalRecord } from "./types/vital";
import { LoginResponse } from "./types/login";
import { ResidentDigitalTwinData } from "./types/digitalTwin";
import { Resident } from "./types/resident";

export const BASE_URL =
  (import.meta.env && import.meta.env.VITE_APP_BASE_URL) ||
  "http://localhost:4000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function loginUser(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await api.post("/v1/auth/login", {
    email,
    emailAddress: email,
    password,
  });

  const data = (response.data?.data || response.data) as LoginResponse;

  if (data?.token) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("accessToken", data.token);
    if (data.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken);
    }
    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
    }
    localStorage.setItem("auth", JSON.stringify(data));
  }

  return data;
}

export async function getVitals(): Promise<VitalRecord[]> {
  const token = localStorage.getItem("token") || "";
  const response = await api.get("/v1/vitals", {
    headers: {
      Authorization: `Bearer ${token}`,
      accessToken: token,
      "x-access-token": token,
    },
  });

  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : data ? [data] : [];
}

export interface PaginationParams {
  total?: number;
  skip?: number;
  limit?: number;
}

export async function getVitalsTrendData(
  pagination: PaginationParams = {
    total: 50,
    skip: 0,
    limit: 100,
  },
): Promise<VitalRecord[]> {
  const token = localStorage.getItem("token") || "";
  const paginationPayload = {
    total: pagination.total ?? 50,
    skip: pagination.skip ?? 0,
    limit: pagination.limit ?? 100,
  };

  const response = await api.get("/v1/vitals", {
    headers: {
      Authorization: `Bearer ${token}`,
      accessToken: token,
      "x-access-token": token,
    },
    params: {
      limit: paginationPayload.limit,
      skip: paginationPayload.skip,
      total: paginationPayload.total,
      pagination: paginationPayload,
    },
  });

  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : data ? [data] : [];
}

export async function getDigitalTwin(
  residentId: number,
): Promise<ResidentDigitalTwinData> {
  const token = localStorage.getItem("token") || "";
  const response = await api.get(`/v1/digital-twin/resident/${residentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      accessToken: token,
      "x-access-token": token,
    },
  });

  const data = response.data?.data || response.data;
  console.log("digitalTwinData", data);
  return data;
}

export async function getResidentDetails(
  residentId: number,
): Promise<Resident> {
  const token = localStorage.getItem("token") || "";
  const response = await api.get(`/v1/residents/${residentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      accessToken: token,
      "x-access-token": token,
    },
  });

  const data = response.data?.data || response.data;
  return data;
}

export interface AgentChatResponse {
  response: string;
  status: string;
  model?: string;
}

export const AGENT_API_URL =
  (import.meta.env && import.meta.env.VITE_AGENT_API_URL) ||
  "http://localhost:8000/api/chat";

export async function sendAgentChatMessage(
  message: string,
  residentId: number = 1,
): Promise<AgentChatResponse> {
  const response = await axios.post<AgentChatResponse>(
    AGENT_API_URL,
    {
      message,
      resident_id: residentId,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
}

export interface FallIncidentData {
  id: number;
  residentId: number;
  bandId: number | null;
  impactForceG: number;
  orientationChangeDeg: number;
  motionlessDurationSeconds: number;
  severity: string;
  status: string;
  location: string;
  clinicalDescription?: string;
  detectedAt: string;
}

export async function getLatestUnresolvedFall(
  residentId?: number,
): Promise<FallIncidentData | null> {
  try {
    const token = localStorage.getItem("token") || "";
    const response = await api.get("/v1/falls/latest-unresolved", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: residentId ? { residentId } : undefined,
    });
    return response.data?.data || null;
  } catch {
    return null;
  }
}

export async function resolveFallIncident(
  id: number,
  status: "resolved_false_alarm" | "resolved_assisted" | "emergency_dispatched",
  notes?: string,
): Promise<any> {
  const token = localStorage.getItem("token") || "";
  const response = await api.post(
    `/v1/falls/${id}/resolve`,
    {
      status,
      resolvedBy: "Resident (Patient App)",
      resolutionNotes:
        notes ||
        (status === "resolved_false_alarm"
          ? "Resident confirmed OK from bedside tablet/mobile."
          : "Assistance requested by resident."),
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return response.data;
}

export async function getResidentGenomicProfile(
  residentId: number = 1,
): Promise<any | null> {
  try {
    const token = localStorage.getItem("token") || "";
    const response = await api.get(`/v1/genomics/resident/${residentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data?.data || null;
  } catch {
    return null;
  }
}

export async function getResidentHealthspan(
  residentId: number = 1,
): Promise<any | null> {
  try {
    const token = localStorage.getItem("token") || "";
    const response = await api.get(
      `/v1/healthspan/resident/${residentId}/latest`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data?.data || null;
  } catch {
    return null;
  }
}

export default api;
