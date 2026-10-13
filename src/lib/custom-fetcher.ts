import { apiFetch } from './api';

interface OrvalRequestConfig {
  url: string;
  method: string;
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export const customFetch = async <T>(
  config: OrvalRequestConfig,
  _options?: unknown,
): Promise<T> => {
  let url = config.url;

  if (config.params && Object.keys(config.params).length > 0) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(config.params)) {
      if (v !== undefined && v !== null) qs.set(k, String(v));
    }
    url = `${url}?${qs.toString()}`;
  }

  const res = await apiFetch(url, {
    method: config.method,
    headers: config.headers as HeadersInit | undefined,
    body: config.data ? JSON.stringify(config.data) : undefined,
    signal: config.signal,
  });

  if (!res.ok) {
    const body = await res.text();
    throw Object.assign(new Error(`HTTP ${res.status}`), {
      status: res.status,
      body,
    });
  }
  const contentType = res.headers.get('content-type');
  if (res.status === 204 || !contentType?.includes('application/json')) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
};
