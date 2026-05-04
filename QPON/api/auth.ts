import { api, setStoredToken } from "./client";
import type { TokenResponse, User } from "./types";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: "user" | "company";
  company_name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function register(payload: RegisterPayload): Promise<TokenResponse> {
  const response = await api.post<TokenResponse>("/auth/register", payload, false);
  await setStoredToken(response.access_token);
  return response;
}

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const response = await api.post<TokenResponse>("/auth/login", payload, false);
  await setStoredToken(response.access_token);
  return response;
}

export async function getMe(): Promise<User> {
  return api.get<User>("/me");
}
