import axios, { type AxiosRequestConfig } from "axios";

export function normalizeApiBaseUrl(configuredUrl: string) {
  const trimmed = configuredUrl.trim();
  if (!trimmed) {
    return "";
  }

  return normalizeApiBaseUrlForLocation(
    trimmed,
    typeof window === "undefined" ? null : window.location,
  );
}

export function normalizeApiBaseUrlForLocation(
  configuredUrl: string,
  currentLocation: Pick<Location, "origin" | "protocol" | "hostname" | "port"> | null,
) {
  if (!currentLocation) {
    return configuredUrl;
  }

  try {
    const resolved = new URL(configuredUrl, currentLocation.origin);
    if (
      currentLocation.protocol === "https:" &&
      resolved.protocol === "http:" &&
      resolved.hostname === currentLocation.hostname
    ) {
      resolved.protocol = "https:";
      if (currentLocation.port) {
        resolved.port = currentLocation.port;
      } else if (resolved.port === "80") {
        resolved.port = "";
      }
    }
    return resolved.origin === currentLocation.origin ? "" : resolved.origin;
  } catch {
    return configuredUrl;
  }
}

export const API_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL || "");

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

export async function apiPut<T>(path: string, payload?: unknown, authenticated = false) {
  const response = await axios.put<T>(
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
