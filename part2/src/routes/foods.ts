import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { fetchFoodItems, groupIdForFoodItem, hydrateFoodItems } from '../db/repository.js';
import { asyncHandler } from '../lib/async-handler.js';
import { notFound } from '../lib/http-error.js';
import { uuidParam } from '../lib/params.js';
import { assertGroupMember, currentUser, requireAuth } from '../middleware/auth.js';
import { FOOD_CATEGORIES } from '../types.js';

/** Mounted at /groups/:groupId/foods — needs the parent's params. */
export const groupFoodsRouter = Router({ mergeParams: true });
/** Mounted at /foods — single-item reads. */
export const foodsRouter = Router();

groupFoodsRouter.use(requireAuth);
foodsRouter.use(requireAuth);

const createFoodSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).default(''),
  category: z.enum(FOOD_CATEGORIES).default('Other'),
  imageUrl: z.string().trim().max(2000).default(''),
});

groupFoodsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const groupId = uuidParam(req, 'groupId', 'Group not found');
    await assertGroupMember(groupId, currentUser(req).id);
    const foodItems = await hydrateFoodItems(await fetchFoodItems([groupId]));
    res.json({ foodItems });
  }),
);

groupFoodsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const groupId = uuidParam(req, 'groupId', 'Group not found');
    const me = currentUser(req);
    await assertGroupMember(groupId, me.id);

    const body = createFoodSchema.parse(req.body);
    const [row] = await query<{ id: string }>(
      `INSERT INTO food_items (group_id, name, description, category, image_url, added_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [groupId, body.name, body.description, body.category, body.imageUrl, me.id],
    );
    if (!row) throw new Error('Insert returned no row');

    const [foodItem] = await hydrateFoodItems(
      (await fetchFoodItems([groupId])).filter((item) => item.id === row.id),
    );
    res.status(201).json({ foodItem });
  }),
);

/** GET /foods/:id — one food item with its reviews and comments. */
foodsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const foodId = uuidParam(req, 'id', 'Food item not found');

    const groupId = await groupIdForFoodItem(foodId);
    await assertGroupMember(groupId, currentUser(req).id);

    const [foodItem] = await hydrateFoodItems(
      (await fetchFoodItems([groupId])).filter((item) => item.id === foodId),
    );
    if (!foodItem) throw notFound('Food item not found');
    res.json({ foodItem });
  }),
);
