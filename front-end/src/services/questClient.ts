import { secureStorage } from './storage';

const TOKEN_KEY = 'quest_token_v1';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getQuestToken(): string | null {
  return secureStorage.get<string | null>(TOKEN_KEY, null);
}

export function setQuestToken(token: string | null): void {
  if (token) {
    secureStorage.set(TOKEN_KEY, token);
    return;
  }
  secureStorage.remove(TOKEN_KEY);
}

function questBaseUrl(): string {
  const fromEnv = (import.meta.env.APP_API_URL || '').trim().replace(/\/$/, '');
  return fromEnv || '/api/quest';
}

function apiBaseUrl(): string {
  return questBaseUrl().replace(/\/quest$/, '');
}

function buildQuery(payload?: Record<string, unknown>): string {
  if (!payload) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function errorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body && typeof (body as { message: unknown }).message === 'string') {
    return (body as { message: string }).message;
  }
  return fallback;
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  const token = getQuestToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function sendQuest<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await parseBody(response);

  if (!response.ok) {
    if (response.status === 401) {
      setQuestToken(null);
    }
    throw new ApiError(errorMessage(body, `Erreur API (${response.status})`), response.status);
  }

  return body as T;
}

async function questRequest<T>(ref: string, method: 'GET' | 'POST', payload?: Record<string, unknown>): Promise<T> {
  const url = `${questBaseUrl()}/${ref}${method === 'GET' ? buildQuery(payload) : ''}`;
  const headers = authHeaders();

  const init: RequestInit = { method, headers };
  if (method === 'POST') {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(payload ?? {});
  }

  return sendQuest<T>(url, init);
}

export function questGet<T>(ref: string, payload?: Record<string, unknown>): Promise<T> {
  return questRequest<T>(ref, 'GET', payload);
}

export function questPost<T>(ref: string, payload?: Record<string, unknown>): Promise<T> {
  return questRequest<T>(ref, 'POST', payload);
}

export function questPostForm<T>(ref: string, form: FormData): Promise<T> {
  return sendQuest<T>(`${questBaseUrl()}/${ref}`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
}

export function apiPostForm<T>(path: string, form: FormData): Promise<T> {
  return sendQuest<T>(`${apiBaseUrl()}/${path.replace(/^\//, '')}`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
}

export async function apiDownload(path: string, filename: string): Promise<void> {
  const headers = authHeaders();
  headers.Accept = '*/*';
  const response = await fetch(`${apiBaseUrl()}/${path.replace(/^\//, '')}`, { headers });

  if (!response.ok) {
    const body = await parseBody(response);
    if (response.status === 401) {
      setQuestToken(null);
    }
    throw new ApiError(errorMessage(body, `Erreur API (${response.status})`), response.status);
  }

  const fileUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(fileUrl);
}
