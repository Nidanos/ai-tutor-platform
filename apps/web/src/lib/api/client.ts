
export type ApiErrorBody = {
    code: string;
    message: string;
    details?: unknown;
};

export class ApiError extends Error {
    constructor(
        readonly status: number,
        readonly body: ApiErrorBody
    ) {
        super(body.message);
        this.name = "ApiError";
    }
}

type ApiEnvelope<T> = {
    success: boolean;
    data: T;
    error: ApiErrorBody;
};

const NO_REFRESH = [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
];

let refreshing: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
    if (!refreshing) {
        refreshing = fetch("/api/v1/auth/refresh", {
            method: "POST",
        })
            .then((response) => response.ok)
            .catch(() => false)
            .finally(() => {
                refreshing = null;
            });
    }

    return refreshing;
}

export async function api<T = void>(
    path: string,
    init: RequestInit = {},
    retried = false
): Promise<T> {
    const headers = new Headers(init.headers);

    if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`/api/v1${path}`, {
        ...init,
        headers,
        credentials: "same-origin",
        cache: "no-store",
    });

    if (response.status === 204) {
        return undefined as T;
    }

    const body = (await response.json()) as ApiEnvelope<T>;

    if (body.success) {
        return body.data;
    }

    if (
        response.status === 401 &&
        !retried &&
        !NO_REFRESH.includes(path) &&
        (await refreshSession())
    ) {
        return api<T>(path, init, true);
    }

    throw new ApiError(
        response.status,
        body.error ?? {
            code: "UNKNOWN_ERROR",
            message: "Something went wrong. Please try again.",
        }
    );
}
