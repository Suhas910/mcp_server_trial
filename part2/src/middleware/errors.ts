import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../lib/http-error.js';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new HttpError(404, `No route for ${req.method} ${req.path}`));
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  // Express only treats a 4-arity function as error middleware, so `next` stays.
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    res.status(400).json({ error: 'Invalid request body', details: error.issues });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message, details: error.details });
    return;
  }

  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
}
