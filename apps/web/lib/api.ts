import type { PaginationMeta } from '@edham/shared-types';
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
  meta?: PaginationMeta;
  error?: { code: string; message: string };
}

export interface Paged<T> {
  data: T[];
  meta: PaginationMeta;
}

async function rawRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  retry = true,
): Promise<Envelope<T>> {
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
    if (refreshed) return rawRequest<T>(method, path, body, false);
    tokenStore.clear();
  }

  const json = (await res.json().catch(() => ({}))) as Envelope<T>;
  if (!res.ok || json.success === false) {
    throw new ApiError(json.error?.message ?? 'حدث خطأ غير متوقع', json.error?.code, res.status);
  }
  return json;
}

/** يفكّ الغلاف ويُرجّع data فقط (الاستخدام الشائع). */
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const env = await rawRequest<T>(method, path, body);
  return env.data as T;
}

/** لنقاط النهاية المُصفّحة: يُرجّع { data, meta }. */
async function requestPaged<T>(path: string): Promise<Paged<T>> {
  const env = await rawRequest<T[]>('GET', path);
  const data = env.data ?? [];
  return {
    data,
    meta: env.meta ?? { page: 1, limit: data.length, total: data.length, totalPages: 1 },
  };
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

/** تنزيل ملف (CSV) مع ترويسة المصادقة ثم حفظه في المتصفح. */
async function download(path: string, filename: string): Promise<void> {
  const headers: Record<string, string> = {};
  const token = tokenStore.access;
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${config.apiBaseUrl}${path}`, { headers });
  if (!res.ok) throw new ApiError('تعذّر تنزيل الملف', undefined, res.status);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  get: <T>(path: string): Promise<T> => request<T>('GET', path),
  getPaged: <T>(path: string): Promise<Paged<T>> => requestPaged<T>(path),
  post: <T>(path: string, body?: unknown): Promise<T> => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown): Promise<T> => request<T>('PATCH', path, body),
  del: <T>(path: string): Promise<T> => request<T>('DELETE', path),
  download,
};
