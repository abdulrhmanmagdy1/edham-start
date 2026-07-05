import { config } from './config';
import { tokenStore } from './tokens';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  retry = true,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = tokenStore.access;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${config.apiBaseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('تعذّر الاتصال بالخادم');
  }

  // تجديد التوكن عند 401 مرة واحدة
  if (res.status === 401 && retry && tokenStore.refresh && !path.startsWith('/auth/')) {
    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(method, path, body, false);
    tokenStore.clear();
  }

  const json = (await res.json().catch(() => ({}))) as Envelope<T>;
  if (!res.ok || json.success === false) {
    throw new ApiError(json.error?.message ?? 'حدث خطأ غير متوقع', json.error?.code, res.status);
  }
  return json.data as T;
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${config.apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokenStore.refresh }),
    });
    const json = (await res.json()) as Envelope<{ accessToken: string }>;
    if (res.ok && json.data?.accessToken) {
      tokenStore.setAccess(json.data.accessToken);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export const api = {
  get: <T>(path: string): Promise<T> => request<T>('GET', path),
  post: <T>(path: string, body?: unknown): Promise<T> => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown): Promise<T> => request<T>('PATCH', path, body),
  del: <T>(path: string): Promise<T> => request<T>('DELETE', path),
};
