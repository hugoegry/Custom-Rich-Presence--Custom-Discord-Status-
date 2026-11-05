import { APP_CODE_NAME } from '../branding';
import type { ApiOk, BootstrapResponse, PresenceForm, PresencePreset } from '../types/presence';

declare global {
  interface Window {
    __APP_TOKEN__?: string;
  }
}

const TOKEN_STORAGE_KEY = `${APP_CODE_NAME}-app-token`;

function resolveAppToken(): string {
  const fromWindow = window.__APP_TOKEN__?.trim();
  if (fromWindow) {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, fromWindow);
    return fromWindow;
  }

  const params = new URLSearchParams(window.location.search);
  const fromQuery = (params.get('t') || '').trim();
  if (fromQuery) {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, fromQuery);
    params.delete('t');
    const query = params.toString();
    const next = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', next);
    return fromQuery;
  }

  return sessionStorage.getItem(TOKEN_STORAGE_KEY)?.trim() || '';
}

async function request<T>(path: string, method: 'GET' | 'POST' | 'DELETE' = 'GET', body?: unknown): Promise<T> {
  const token = resolveAppToken();
  const headers: Record<string, string> = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers['X-App-Token'] = token;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json().catch(() => ({}))) as ApiOk & T;
  if (!res.ok || data.ok === false) throw new Error(data.error ?? `Erreur ${res.status}`);
  return data;
}

export function fetchBootstrap(): Promise<BootstrapResponse> {
  return request<BootstrapResponse>('/api/bootstrap');
}

export function updatePresence(form: PresenceForm): Promise<ApiOk> {
  const { activity_name, ...rest } = form;
  return request<ApiOk>('/api/update', 'POST', {
    ...rest,
    name: activity_name,
  });
}

export function disconnectRpc(): Promise<ApiOk> {
  return request<ApiOk>('/api/disconnect', 'POST', {});
}

export function savePreset(preset: PresencePreset & { old_name?: string }): Promise<ApiOk> {
  return request<ApiOk>('/api/presets', 'POST', preset);
}

export function deletePreset(name: string): Promise<ApiOk> {
  return request<ApiOk>('/api/presets', 'DELETE', { name });
}

export function saveSettings(settings: {
  client_id?: string;
  launch_at_startup?: boolean;
  auto_apply_on_launch?: boolean;
}): Promise<ApiOk & { client_id?: string }> {
  return request<ApiOk & { client_id?: string }>('/api/settings', 'POST', settings);
}