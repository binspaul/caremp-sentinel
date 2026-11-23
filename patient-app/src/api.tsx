import axios from "axios";
import { VitalRecord } from "./types/vital";
import { LoginResponse } from "./types/login";
import { ResidentDigitalTwinData } from "./types/digitalTwin";

export const BASE_URL =
  (import.meta.env && import.meta.env.VITE_APP_BASE_URL) || "http://localhost:4000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
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

export default api;
