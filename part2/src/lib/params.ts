import type { Request } from 'express';
import { notFound } from './http-error.js';
import { isUuid } from './invite-code.js';

// Express 5 types params as `string | string[]` to cover wildcard routes.
// None of ours are wildcards, so narrow once here instead of at every call site.
export function param(req: Request, name: string, message = 'Not found'): string {
  const value = (req.params as Record<string, string | string[] | undefined>)[name];
  if (typeof value !== 'string' || value.length === 0) throw notFound(message);
  return value;
}

/** Same, but rejects anything that isn't a UUID so a bad id 404s instead of erroring in Postgres. */
export function uuidParam(req: Request, name: string, message = 'Not found'): string {
  const value = param(req, name, message);
  if (!isUuid(value)) throw notFound(message);
  return value;
}
