import { apiFetch } from "./client";

export type UserRole = "doctor" | "patient" | "admin" | "secretary";

export type AuthUser = {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  linkedDoctorId?: string | null;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export async function loginDoctor(
  identifier: string,
  password: string
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: { identifier, password, role: "doctor" },
    noAuth: true,
  });
}

export async function loginPatient(
  identifier: string,
  password: string
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: { identifier, password, role: "patient" },
    noAuth: true,
  });
}

export async function registerPatient(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
}): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/register", {
    method: "POST",
    body: data,
    noAuth: true,
  });
}

export async function getMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/me");
}

export async function refreshToken(): Promise<{ token: string }> {
  return apiFetch<{ token: string }>("/auth/refresh", { method: "POST" });
}
