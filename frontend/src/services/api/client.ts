const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1';

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

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
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

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: any = null;
    try {
      errorData = await response.json();
    } catch {
      // ignore
    }

    const message =
      errorData?.message ||
      (errorData?.errors ? Object.values(errorData.errors).flat().join(', ') : null) ||
      `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, errorData);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}
