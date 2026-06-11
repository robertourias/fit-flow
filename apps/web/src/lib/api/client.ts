import type { ApiResponse } from "@fitflow/types";

export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

const COOKIE_NAMES = ["__Secure-authjs.session-token", "authjs.session-token"];

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let url: string;
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");

  if (typeof window === "undefined") {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    const token = COOKIE_NAMES.map((n) => store.get(n)?.value).find(Boolean);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    url = new URL(`/api/v1${path}`, process.env.NEXT_PUBLIC_API_URL).toString();
  } else {
    url = `/api/proxy${path}`;
  }

  const res = await fetch(url, { ...init, headers });
  if (res.status === 204) return undefined as T;

  const json = (await res.json()) as ApiResponse<T>;
  if (json.error) {
    const message = Array.isArray(json.error.message) ? json.error.message.join(", ") : json.error.message;
    throw new ApiClientError(res.status, message);
  }
  return json.data as T;
}
