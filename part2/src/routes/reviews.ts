import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { fetchReviews, groupIdForFoodItem } from '../db/repository.js';
import { asyncHandler } from '../lib/async-handler.js';
import { notFound } from '../lib/http-error.js';
import { uuidParam } from '../lib/params.js';
import { assertGroupMember, currentUser, requireAuth } from '../middleware/auth.js';

/** Mounted at /foods/:foodId/reviews. */
export const foodReviewsRouter = Router({ mergeParams: true });
/** Mounted at /reviews — likes on an existing review. */
export const reviewsRouter = Router();

foodReviewsRouter.use(requireAuth);
reviewsRouter.use(requireAuth);

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().max(2000).default(''),
});

/** Membership of the group owning this food item, resolved from the food id. */
async function assertCanAccessFood(foodId: string, userId: string): Promise<void> {
  await assertGroupMember(await groupIdForFoodItem(foodId), userId);
}

foodReviewsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const foodId = uuidParam(req, 'foodId', 'Food item not found');
    await assertCanAccessFood(foodId, currentUser(req).id);
    const reviews = (await fetchReviews([foodId])).map(({ foodItemId: _f, ...review }) => review);
    res.json({ reviews });
  }),
);

/**
 * POST /foods/:foodId/reviews — add or update the caller's review.
 * One review per member per item, so a repeat post upserts rather than duplicating.
 */
foodReviewsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const foodId = uuidParam(req, 'foodId', 'Food item not found');
    const me = currentUser(req);
    await assertCanAccessFood(foodId, me.id);

    const body = reviewSchema.parse(req.body);
    const [row] = await query<{ id: string; inserted: boolean }>(
      `INSERT INTO reviews (food_item_id, user_id, rating, text)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (food_item_id, user_id)
       DO UPDATE SET rating = EXCLUDED.rating, text = EXCLUDED.text, updated_at = now()
       RETURNING id, (xmax = 0) AS inserted`,
      [foodId, me.id, body.rating, body.text],
    );
    if (!row) throw new Error('Upsert returned no row');

    const [review] = (await fetchReviews([foodId]))
      .filter((item) => item.id === row.id)
      .map(({ foodItemId: _f, ...rest }) => rest);

    res.status(row.inserted ? 201 : 200).json({ review });
  }),
);

/** POST /reviews/:id/like — toggle the caller's like. */
reviewsRouter.post(
  '/:id/like',
  asyncHandler(async (req, res) => {
    const reviewId = uuidParam(req, 'id', 'Review not found');
    const me = currentUser(req);

    const [row] = await query<{ foodItemId: string }>(
      'SELECT food_item_id AS "foodItemId" FROM reviews WHERE id = $1',
      [reviewId],
    );
    if (!row) throw notFound('Review not found');
    await assertCanAccessFood(row.foodItemId, me.id);

    const deleted = await query(
      'DELETE FROM review_likes WHERE review_id = $1 AND user_id = $2 RETURNING user_id',
      [reviewId, me.id],
    );
    if (deleted.length === 0) {
      await query('INSERT INTO review_likes (review_id, user_id) VALUES ($1, $2)', [reviewId, me.id]);
    }

    const [review] = (await fetchReviews([row.foodItemId]))
      .filter((item) => item.id === reviewId)
      .map(({ foodItemId: _f, ...rest }) => rest);

    res.json({ review, liked: deleted.length === 0 });
  }),
);
