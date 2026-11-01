export type ApiErrorBody = { code: string; message: string; details?: unknown };
type ApiEnvelope<T> = { success: boolean; data: T; error?: ApiErrorBody };

// status 0: the request never reached the API, so a submission can be retried with the same key.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorBody,
  ) {
    super(body.message);
    this.name = "ApiError";
  }
}

const NO_REFRESH = ["/auth/login", "/auth/register", "/auth/refresh"];
let refreshing: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshing ??= fetch("/api/v1/auth/refresh", { method: "POST" })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function api<T = void>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, { ...init, headers, credentials: "same-origin", cache: "no-store" });
  } catch {
    throw new ApiError(0, { code: "NETWORK_ERROR", message: "Couldn't reach AI Tutor. Check your connection and try again." });
  }
  if (response.status === 204) return undefined as T;

  let body: ApiEnvelope<T>;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError(response.status, { code: "INVALID_RESPONSE", message: "The server sent an unreadable reply. Please try again." });
  }
  if (body.success) return body.data;

  if (response.status === 401 && !retried && !NO_REFRESH.includes(path) && (await refreshSession())) {
    return api<T>(path, init, true);
  }
  throw new ApiError(response.status, body.error ?? { code: "UNKNOWN_ERROR", message: "Something went wrong. Please try again." });
}

export const errorMessage = (cause: unknown, fallback: string) => (cause instanceof ApiError ? cause.body.message : fallback);
