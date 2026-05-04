import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "qpon_access_token";

// Change this to your machine's local IP when testing on a physical device.
// For emulator/simulator use http://10.0.2.2:8000 (Android) or http://localhost:8000 (iOS sim / web).
const DEV_BASE_URL = "http://localhost:8000";

export function getBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL ?? DEV_BASE_URL;
}

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export class ApiResponseError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string
  ) {
    super(detail);
    this.name = "ApiResponseError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (authenticated) {
    const token = await getStoredToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      `No se pudo conectar con la API en ${getBaseUrl()}. Verifica que el backend este corriendo y que CORS permita este origen.`
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = {};
  }

  if (!response.ok) {
    const detail =
      (body as { detail?: string }).detail ?? `HTTP ${response.status}`;
    throw new ApiResponseError(response.status, detail);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string, authenticated = true) =>
    request<T>(path, { method: "GET" }, authenticated),

  post: <T>(path: string, data: unknown, authenticated = true) =>
    request<T>(path, { method: "POST", body: JSON.stringify(data) }, authenticated),
};
