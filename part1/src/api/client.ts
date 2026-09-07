// Base fetch wrapper for the part2 API.
//
// The auth token is held in a module-level variable rather than localStorage,
// per the auth task's stated assumption: nothing an XSS payload can read off
// disk. The trade-off is that a page reload ends the session — see the note in
// AuthContext about what a refresh-token flow would take.

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

/** An API response that wasn't 2xx. `status` lets callers branch on 401 vs 403. */
export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// Set by AuthContext so a token that expires mid-session logs the user out
// rather than leaving every request silently failing.
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Skip the logout-on-401 hook — used by login/register, where a 401 is just a wrong password. */
  allowUnauthorized?: boolean;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, allowUnauthorized = false } = options;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    // fetch only rejects on a network-level failure, so this is "API unreachable".
    throw new ApiError(0, 'Cannot reach the server. Is the API running on ' + BASE_URL + '?');
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && !allowUnauthorized) onUnauthorized?.();
    const message =
      (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : null) ?? `Request failed (${response.status})`;
    throw new ApiError(response.status, message, (payload as { details?: unknown })?.details);
  }

  return payload as T;
}
