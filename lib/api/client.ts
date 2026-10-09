const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as {
      error?: unknown;
      details?: unknown;
    } | null;
    const message = typeof body?.error === "string"
      ? body.error
      : `API request failed (${response.status} ${response.statusText})`;
    if (response.status === 401 && typeof window !== "undefined") {
      const authRequest = /^\/auth\/(?:login|signup|google(?:\/callback)?)$/.test(path);
      if (!authRequest && window.location.pathname !== "/login" && window.location.pathname !== "/signup") {
        window.dispatchEvent(new Event("agentos:unauthorized"));
      }
    }
    throw new ApiError(message, response.status, body?.details);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
