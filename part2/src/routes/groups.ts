import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../db/pool.js';
import { loadGroup, loadGroups } from '../db/repository.js';
import { asyncHandler } from '../lib/async-handler.js';
import { conflict, notFound } from '../lib/http-error.js';
import { generateInviteCode, isUuid } from '../lib/invite-code.js';
import { param, uuidParam } from '../lib/params.js';
import { assertGroupMember, currentUser, requireAuth } from '../middleware/auth.js';

export const groupsRouter = Router();

groupsRouter.use(requireAuth);

const createGroupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).default(''),
  emoji: z.string().trim().min(1).max(8).default('🍽️'),
  color: z.string().trim().min(1).max(64).default('#f59e0b'),
});

async function memberGroupIds(userId: string): Promise<string[]> {
  const rows = await query<{ groupId: string }>(
    'SELECT group_id AS "groupId" FROM group_members WHERE user_id = $1',
    [userId],
  );
  return rows.map((row) => row.groupId);
}

/** GET /groups — every group the caller belongs to, fully nested. */
groupsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const groups = await loadGroups(await memberGroupIds(currentUser(req).id));
    res.json({ groups });
  }),
);

/** POST /groups — create a group; the creator becomes its first member. */
groupsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createGroupSchema.parse(req.body);
    const me = currentUser(req);

    const groupId = await withTransaction(async (client) => {
      // Retry on the (vanishingly rare) invite-code collision rather than 500.
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const inviteCode = generateInviteCode();
        const existing = await client.query('SELECT 1 FROM groups WHERE invite_code = $1', [inviteCode]);
        if (existing.rowCount) continue;

        const inserted = await client.query<{ id: string }>(
          `INSERT INTO groups (name, description, emoji, color, invite_code, created_by)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [body.name, body.description, body.emoji, body.color, inviteCode, me.id],
        );
        const id = inserted.rows[0]?.id;
        if (!id) throw new Error('Insert returned no row');

        await client.query(
          'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
          [id, me.id],
        );
        return id;
      }
      throw conflict('Could not allocate a unique invite code, please retry');
    });

    res.status(201).json({ group: await loadGroup(groupId) });
  }),
);

/** GET /groups/:id — one group, for the group detail page. */
groupsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const groupId = uuidParam(req, 'id', 'Group not found');
    await assertGroupMember(groupId, currentUser(req).id);
    res.json({ group: await loadGroup(groupId) });
  }),
);

/**
 * POST /groups/:id/join — join a group.
 * `:id` accepts either the group's UUID or its invite code, so the frontend's
 * "enter an invite code" flow works without a second endpoint.
 */
groupsRouter.post(
  '/:id/join',
  asyncHandler(async (req, res) => {
    const identifier = param(req, 'id', 'No group with that id or invite code');
    const me = currentUser(req);

    const [group] = isUuid(identifier)
      ? await query<{ id: string }>('SELECT id FROM groups WHERE id = $1', [identifier])
      : await query<{ id: string }>('SELECT id FROM groups WHERE invite_code = $1', [
          identifier.trim().toUpperCase(),
        ]);
    if (!group) throw notFound('No group with that id or invite code');

    // Joining twice is a no-op, not an error — the user ends up a member either way.
    await query(
      `INSERT INTO group_members (group_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (group_id, user_id) DO NOTHING`,
      [group.id, me.id],
    );

    res.json({ group: await loadGroup(group.id) });
  }),
);
