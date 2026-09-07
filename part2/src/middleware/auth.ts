import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { forbidden, unauthorized } from '../lib/http-error.js';
import type { Member } from '../types.js';

interface TokenPayload {
  sub: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId } satisfies TokenPayload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
}

/**
 * Verifies the Bearer token and loads the user onto `req.user`.
 * The user is re-read per request so a renamed or deleted account takes effect
 * immediately rather than at token expiry.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.get('authorization') ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw unauthorized('Missing Bearer token');
    }

    let payload: TokenPayload;
    try {
      payload = jwt.verify(token, config.jwtSecret) as TokenPayload;
    } catch {
      throw unauthorized('Invalid or expired token');
    }

    const [user] = await query<Member>(
      'SELECT id, name, avatar, color FROM users WHERE id = $1',
      [payload.sub],
    );
    if (!user) throw unauthorized('Account no longer exists');

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/** `req.user` after requireAuth has run. Throws rather than returning undefined. */
export function currentUser(req: Request): Member {
  if (!req.user) throw unauthorized();
  return req.user;
}

/** Every read and write below the group level goes through this. */
export async function assertGroupMember(groupId: string, userId: string): Promise<void> {
  const rows = await query(
    'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId],
  );
  if (rows.length === 0) throw forbidden('You are not a member of this group');
}
