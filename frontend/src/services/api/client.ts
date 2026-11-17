// Localhost API URL (commented out)
// const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';
// const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1';

// Live Backend API URL
const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'https://admin-api.liliumloft.com/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * The text a toast may show for a failed request.
 *
 * The backend only sends short generic sentences, but this is the last line of defence:
 * server crashes (5xx other than 502, which the backend uses for "WooCommerce problem"),
 * rate limits and unreadable replies never show raw text.
 */
function userMessage(status: number, data: any, endpoint?: string): string {
  const isAuthLogin = endpoint && /\/auth\/login/.test(endpoint);
  if (isAuthLogin && (status === 401 || status === 422)) {
    return (
      data?.errors?.email?.[0] ||
      data?.errors?.password?.[0] ||
      data?.message ||
      'Invalid email or password. Please verify your credentials.'
    );
  }

  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (status >= 500 && status !== 502) return 'Something went wrong on the server. Please try again.';

  const message =
    typeof data?.message === 'string' && data.message.trim()
      ? data.message
      : data?.errors
      ? Object.values(data.errors).flat().join(' ')
      : '';

  return message || 'The request could not be completed.';
}

export const getStoredToken = (): string | null => {
  return localStorage.getItem('lilium_access_token');
};

export const setStoredToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('lilium_access_token', token);
  } else {
    localStorage.removeItem('lilium_access_token');
  }
};

const resolveUrl = (endpoint: string) => {
  if (endpoint.startsWith('http')) return endpoint;
  const base = String(API_BASE).replace(/\/+$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Swaps the stored token for a fresh one. Access tokens only last about an hour; the backend accepts
 * an expired token for renewal for a couple of weeks. Parallel requests share one renewal.
 */
function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const token = getStoredToken();
      if (!token) return false;
      try {
        const res = await fetch(resolveUrl('/auth/refresh'), {
          method: 'POST',
          headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return false;
        const data = await res.json();
        if (typeof data?.access_token !== 'string') return false;
        setStoredToken(data.access_token);
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/** The session is really over: forget the token and go to the login page. */
function endSession() {
  setStoredToken(null);
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.assign('/login');
  }
}

async function execute<T>(
  endpoint: string,
  options: RequestInit = {},
  retried = false
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = resolveUrl(endpoint);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    // The browser's own error text ("Failed to fetch", ...) is not for users.
    throw new ApiError('Could not reach the server. Please check your connection and try again.', 0);
  }

  // An expired token: renew it once and repeat the request; if that is impossible, the session is over.
  const isAuthCall = /\/auth\/(login|refresh|logout)/.test(endpoint);
  if (response.status === 401 && token && !isAuthCall) {
    if (!retried && (await refreshSession())) {
      return execute<T>(endpoint, options, true);
    }
    endSession();
  }

  if (!response.ok) {
    let errorData: any = null;
    try {
      errorData = await response.json();
    } catch {
      // not JSON (e.g. a proxy error page): fall through to the generic text
    }

    throw new ApiError(userMessage(response.status, errorData, endpoint), response.status, errorData);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

/** GETs that are already on their way: the same request asked for twice at once is sent once. */
const inFlight = new Map<string, Promise<unknown>>();

export function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  if (method !== 'GET') return execute<T>(endpoint, options);

  // Keyed by the token too, so a different session never shares an answer.
  const key = `${getStoredToken() ?? ''} ${endpoint}`;
  const running = inFlight.get(key);
  if (running) return running as Promise<T>;

  const request = execute<T>(endpoint, options).finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  return request;
}
