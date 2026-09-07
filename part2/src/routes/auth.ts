import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { asyncHandler } from '../lib/async-handler.js';
import { conflict, unauthorized } from '../lib/http-error.js';
import { currentUser, requireAuth, signToken } from '../middleware/auth.js';
import type { Member } from '../types.js';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().trim().min(1).max(60),
  avatar: z.string().trim().min(1).max(8).default('🙂'),
  color: z.string().trim().min(1).max(32).default('#f59e0b'),
});

const loginSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1),
});

const profileSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  avatar: z.string().trim().min(1).max(8).optional(),
  color: z.string().trim().min(1).max(32).optional(),
});

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password, name, avatar, color } = registerSchema.parse(req.body);

    const [existing] = await query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (existing) throw conflict('An account with that email already exists');

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await query<Member>(
      `INSERT INTO users (email, password_hash, name, avatar, color)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, avatar, color`,
      [email, passwordHash, name, avatar, color],
    );
    if (!user) throw new Error('Insert returned no row');

    res.status(201).json({ user, token: signToken(user.id) });
  }),
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const [row] = await query<Member & { passwordHash: string }>(
      'SELECT id, name, avatar, color, password_hash AS "passwordHash" FROM users WHERE email = $1',
      [email],
    );
    // Same message either way — don't leak which emails are registered.
    if (!row || !(await bcrypt.compare(password, row.passwordHash))) {
      throw unauthorized('Incorrect email or password');
    }

    const { passwordHash: _hash, ...user } = row;
    res.json({ user, token: signToken(user.id) });
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: currentUser(req) });
  }),
);

// Backs the part1 ProfilePage editor (name / avatar emoji / accent colour).
authRouter.patch(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const updates = profileSchema.parse(req.body);
    const me = currentUser(req);

    const [user] = await query<Member>(
      `UPDATE users
          SET name   = COALESCE($2, name),
              avatar = COALESCE($3, avatar),
              color  = COALESCE($4, color)
        WHERE id = $1
        RETURNING id, name, avatar, color`,
      [me.id, updates.name ?? null, updates.avatar ?? null, updates.color ?? null],
    );

    res.json({ user });
  }),
);
