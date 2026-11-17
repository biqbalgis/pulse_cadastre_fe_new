/**
 * Minimal fetch client for pulse_cadastre_be_new.
 *
 * - All paths are relative to /api (Vite proxies it in dev, nginx in prod).
 * - Responses shaped like {"payload": ...} are unwrapped.
 * - A 401 triggers one refresh-token attempt, then the request is retried.
 */

const ACCESS_KEY = "pcfn.accessToken";
const REFRESH_KEY = "pcfn.refreshToken";

export const AUTH_EXPIRED_EVENT = "pcfn:auth-expired";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const tokenStore = {
  getAccess: () => sessionStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set(access: string, refresh?: string) {
    sessionStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    sessionStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

type Params = Record<string, string | number | boolean | null | undefined>;

export function buildUrl(path: string, params: Params = {}): string {
  let url = `/api/${path.replace(/^\/+/, "")}`;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const token = `{${key}}`;
    if (url.includes(token)) {
      url = url.replace(token, encodeURIComponent(String(value)));
    } else {
      query.append(key, String(value));
    }
  }
  const qs = query.toString();
  return qs ? `${url}?${qs}` : url;
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return false;

  refreshInFlight ??= (async () => {
    try {
      const res = await fetch(buildUrl("auth/jwt/refresh_access_token/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { accessToken?: string; refreshToken?: string };
      if (!data.accessToken) return false;
      tokenStore.set(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      queueMicrotask(() => {
        refreshInFlight = null;
      });
    }
  })();

  return refreshInFlight;
}

async function readError(res: Response): Promise<string> {
  try {
    const type = res.headers.get("content-type") ?? "";
    if (type.includes("application/json")) {
      const body = await res.json();
      const detail = body?.detail ?? body?.message ?? body?.error ?? body?.payload?.message;
      if (typeof detail === "string") return detail;
      if (Array.isArray(detail)) {
        return detail.map((d) => d?.msg ?? JSON.stringify(d)).join("; ");
      }
      if (detail) return JSON.stringify(detail);
    } else {
      const text = (await res.text()).trim();
      if (text && text.length < 300) return text;
    }
  } catch {
    // fall through to the generic message
  }
  return res.status >= 500
    ? "The server hit an error. Please try again."
    : `Request failed (${res.status}).`;
}

type RequestOptions = {
  params?: Params;
  body?: unknown;
  auth?: boolean;
};

async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  const { params, body, auth = true } = opts;
  const url = buildUrl(path, params);
  const isForm = body instanceof FormData;

  const send = () => {
    const headers = new Headers();
    if (body !== undefined && !isForm) headers.set("Content-Type", "application/json");
    const token = auth ? tokenStore.getAccess() : null;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  };

  let res = await send();

  if (res.status === 401 && auth) {
    if (await refreshAccessToken()) {
      res = await send();
    }
    if (res.status === 401) {
      tokenStore.clear();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, await readError(res));
  }

  if (res.status === 204) return undefined as T;
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) return (await res.text()) as T;

  const data = await res.json();
  return (data && typeof data === "object" && "payload" in data ? data.payload : data) as T;
}

export const api = {
  get: <T>(path: string, params?: Params) => request<T>("GET", path, { params }),
  post: <T>(path: string, body?: unknown, params?: Params) => request<T>("POST", path, { body: body ?? {}, params }),
  put: <T>(path: string, body?: unknown, params?: Params) => request<T>("PUT", path, { body, params }),
  delete: <T>(path: string, params?: Params) => request<T>("DELETE", path, { params }),
  raw: request,
};

/** Fetch a protected file and open/save it via an object URL. */
export async function downloadProtected(path: string, params: Params, filename: string): Promise<void> {
  const url = buildUrl(path, params);
  const send = () =>
    fetch(url, {
      headers: tokenStore.getAccess() ? { Authorization: `Bearer ${tokenStore.getAccess()}` } : {},
    });
  let res = await send();
  if (res.status === 401 && (await refreshAccessToken())) res = await send();
  if (!res.ok) throw new ApiError(res.status, await readError(res));

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}
