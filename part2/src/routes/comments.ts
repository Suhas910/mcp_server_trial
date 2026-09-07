import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { fetchComments, groupIdForFoodItem } from '../db/repository.js';
import { asyncHandler } from '../lib/async-handler.js';
import { notFound } from '../lib/http-error.js';
import { uuidParam } from '../lib/params.js';
import { assertGroupMember, currentUser, requireAuth } from '../middleware/auth.js';

/** Mounted at /foods/:foodId/comments. */
export const foodCommentsRouter = Router({ mergeParams: true });
/** Mounted at /comments — likes on an existing comment. */
export const commentsRouter = Router();

foodCommentsRouter.use(requireAuth);
commentsRouter.use(requireAuth);

const commentSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

async function assertCanAccessFood(foodId: string, userId: string): Promise<void> {
  await assertGroupMember(await groupIdForFoodItem(foodId), userId);
}

foodCommentsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const foodId = uuidParam(req, 'foodId', 'Food item not found');
    await assertCanAccessFood(foodId, currentUser(req).id);
    const comments = (await fetchComments([foodId])).map(({ foodItemId: _f, ...rest }) => rest);
    res.json({ comments });
  }),
);

foodCommentsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const foodId = uuidParam(req, 'foodId', 'Food item not found');
    const me = currentUser(req);
    await assertCanAccessFood(foodId, me.id);

    const body = commentSchema.parse(req.body);
    const [row] = await query<{ id: string }>(
      'INSERT INTO comments (food_item_id, user_id, text) VALUES ($1, $2, $3) RETURNING id',
      [foodId, me.id, body.text],
    );
    if (!row) throw new Error('Insert returned no row');

    const [comment] = (await fetchComments([foodId]))
      .filter((item) => item.id === row.id)
      .map(({ foodItemId: _f, ...rest }) => rest);

    res.status(201).json({ comment });
  }),
);

/** POST /comments/:id/like — toggle the caller's like. */
commentsRouter.post(
  '/:id/like',
  asyncHandler(async (req, res) => {
    const commentId = uuidParam(req, 'id', 'Comment not found');
    const me = currentUser(req);

    const [row] = await query<{ foodItemId: string }>(
      'SELECT food_item_id AS "foodItemId" FROM comments WHERE id = $1',
      [commentId],
    );
    if (!row) throw notFound('Comment not found');
    await assertCanAccessFood(row.foodItemId, me.id);

    const deleted = await query(
      'DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2 RETURNING user_id',
      [commentId, me.id],
    );
    if (deleted.length === 0) {
      await query('INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2)', [commentId, me.id]);
    }

    const [comment] = (await fetchComments([row.foodItemId]))
      .filter((item) => item.id === commentId)
      .map(({ foodItemId: _f, ...rest }) => rest);

    res.json({ comment, liked: deleted.length === 0 });
  }),
);
