import * as SecureStore from "expo-secure-store";

// ── Base URL ──────────────────────────────────────────────────────────────────
// In production: https://tabibee.com
// In development: change to your local IP
export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "https://tabibee.com";
const MOBILE_PREFIX = `${API_BASE}/api/mobile`;

const TOKEN_KEY = "tabibee_jwt";

// ── Token management ──────────────────────────────────────────────────────────
export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type FetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  noAuth?: boolean;
};

export async function apiFetch<T = unknown>(
  path: string,
  opts: FetchOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {}, noAuth = false } = opts;

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Client": "mobile",
    ...headers,
  };

  if (!noAuth) {
    const token = await getToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const url = path.startsWith("http") ? path : `${MOBILE_PREFIX}${path}`;

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let code: string | undefined;
    try {
      const json = await res.json();
      code = json?.error ?? json?.code;
    } catch {}
    throw new ApiError(res.status, `HTTP ${res.status}`, code);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
