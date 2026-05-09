import axios, { type AxiosRequestConfig } from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "";

export function buildApiUrl(path: string) {
  return `${API_URL}${path}`;
}

export function withAuth(config: AxiosRequestConfig = {}): AxiosRequestConfig {
  const token = localStorage.getItem("token");
  if (!token) {
    return config;
  }

  return {
    ...config,
    headers: {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  };
}

export async function apiGet<T>(path: string, authenticated = false) {
  const response = await axios.get<T>(
    buildApiUrl(path),
    authenticated ? withAuth() : undefined,
  );
  return response.data;
}

export async function apiPost<T>(path: string, payload?: unknown, authenticated = false) {
  const response = await axios.post<T>(
    buildApiUrl(path),
    payload,
    authenticated ? withAuth() : undefined,
  );
  return response.data;
}

export async function apiPatch<T>(path: string, payload?: unknown, authenticated = false) {
  const response = await axios.patch<T>(
    buildApiUrl(path),
    payload,
    authenticated ? withAuth() : undefined,
  );
  return response.data;
}

export async function apiDelete<T>(path: string, authenticated = false) {
  const response = await axios.delete<T>(
    buildApiUrl(path),
    authenticated ? withAuth() : undefined,
  );
  return response.data;
}
