import { query } from './pool.js';
import { notFound } from '../lib/http-error.js';
import type { Comment, FoodItem, Group, Member, Review } from '../types.js';

interface GroupRow {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  inviteCode: string;
  createdAt: string;
}

interface MemberRow extends Member {
  groupId: string;
}

export interface FoodRow {
  id: string;
  groupId: string;
  name: string;
  description: string;
  category: FoodItem['category'];
  imageUrl: string;
  addedBy: string;
  addedByName: string;
  createdAt: string;
}

interface ReviewRow extends Review {
  foodItemId: string;
}

interface CommentRow extends Comment {
  foodItemId: string;
}

/** Groups every row by a key, so the nested shape is assembled in one pass. */
function groupBy<T, K extends keyof T>(rows: T[], key: K): Map<T[K], T[]> {
  const map = new Map<T[K], T[]>();
  for (const row of rows) {
    const bucket = map.get(row[key]);
    if (bucket) bucket.push(row);
    else map.set(row[key], [row]);
  }
  return map;
}

export async function fetchReviews(foodItemIds: string[]): Promise<ReviewRow[]> {
  if (foodItemIds.length === 0) return [];
  return query<ReviewRow>(
    `SELECT r.id,
            r.food_item_id AS "foodItemId",
            r.user_id      AS "memberId",
            u.name         AS "memberName",
            u.avatar       AS "memberAvatar",
            u.color        AS "memberColor",
            r.rating,
            r.text,
            r.created_at   AS "createdAt",
            COALESCE(array_agg(rl.user_id) FILTER (WHERE rl.user_id IS NOT NULL), '{}') AS likes
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       LEFT JOIN review_likes rl ON rl.review_id = r.id
      WHERE r.food_item_id = ANY($1::uuid[])
      GROUP BY r.id, u.id
      ORDER BY r.created_at DESC`,
    [foodItemIds],
  );
}

export async function fetchComments(foodItemIds: string[]): Promise<CommentRow[]> {
  if (foodItemIds.length === 0) return [];
  return query<CommentRow>(
    `SELECT c.id,
            c.food_item_id AS "foodItemId",
            c.user_id      AS "memberId",
            u.name         AS "memberName",
            u.avatar       AS "memberAvatar",
            u.color        AS "memberColor",
            c.text,
            c.created_at   AS "createdAt",
            COALESCE(array_agg(cl.user_id) FILTER (WHERE cl.user_id IS NOT NULL), '{}') AS likes
       FROM comments c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN comment_likes cl ON cl.comment_id = c.id
      WHERE c.food_item_id = ANY($1::uuid[])
      GROUP BY c.id, u.id
      ORDER BY c.created_at ASC`,
    [foodItemIds],
  );
}

/** Food items for the given groups, with their reviews and comments attached. */
export async function fetchFoodItems(groupIds: string[]): Promise<FoodRow[]> {
  if (groupIds.length === 0) return [];
  return query<FoodRow>(
    `SELECT f.id,
            f.group_id    AS "groupId",
            f.name,
            f.description,
            f.category,
            f.image_url   AS "imageUrl",
            f.added_by    AS "addedBy",
            u.name        AS "addedByName",
            f.created_at  AS "createdAt"
       FROM food_items f
       JOIN users u ON u.id = f.added_by
      WHERE f.group_id = ANY($1::uuid[])
      ORDER BY f.created_at DESC`,
    [groupIds],
  );
}

export async function hydrateFoodItems(foodRows: FoodRow[]): Promise<FoodItem[]> {
  const foodIds = foodRows.map((row) => row.id);
  const [reviews, comments] = await Promise.all([fetchReviews(foodIds), fetchComments(foodIds)]);
  const reviewsByFood = groupBy(reviews, 'foodItemId');
  const commentsByFood = groupBy(comments, 'foodItemId');

  return foodRows.map(({ groupId: _groupId, ...food }) => ({
    ...food,
    reviews: (reviewsByFood.get(food.id) ?? []).map(({ foodItemId: _f, ...review }) => review),
    comments: (commentsByFood.get(food.id) ?? []).map(({ foodItemId: _f, ...comment }) => comment),
  }));
}

/** Loads full nested Group objects — members, food items, reviews and comments. */
export async function loadGroups(groupIds: string[]): Promise<Group[]> {
  if (groupIds.length === 0) return [];

  const [groupRows, memberRows, foodRows] = await Promise.all([
    query<GroupRow>(
      `SELECT id, name, description, emoji, color,
              invite_code AS "inviteCode",
              created_at  AS "createdAt"
         FROM groups
        WHERE id = ANY($1::uuid[])
        ORDER BY created_at DESC`,
      [groupIds],
    ),
    query<MemberRow>(
      `SELECT gm.group_id AS "groupId", u.id, u.name, u.avatar, u.color
         FROM group_members gm
         JOIN users u ON u.id = gm.user_id
        WHERE gm.group_id = ANY($1::uuid[])
        ORDER BY gm.joined_at ASC`,
      [groupIds],
    ),
    fetchFoodItems(groupIds),
  ]);

  const foodItems = await hydrateFoodItems(foodRows);
  const foodItemById = new Map(foodItems.map((item) => [item.id, item]));
  const membersByGroup = groupBy(memberRows, 'groupId');
  const foodRowsByGroup = groupBy(foodRows, 'groupId');

  return groupRows.map((group) => ({
    ...group,
    members: (membersByGroup.get(group.id) ?? []).map(({ groupId: _g, ...member }) => member),
    foodItems: (foodRowsByGroup.get(group.id) ?? [])
      .map((row) => foodItemById.get(row.id))
      .filter((item): item is FoodItem => item !== undefined),
  }));
}

export async function loadGroup(groupId: string): Promise<Group> {
  const [group] = await loadGroups([groupId]);
  if (!group) throw notFound('Group not found');
  return group;
}

/** The group a food item belongs to — used for membership checks on /foods/:id/*. */
export async function groupIdForFoodItem(foodItemId: string): Promise<string> {
  const [row] = await query<{ groupId: string }>(
    'SELECT group_id AS "groupId" FROM food_items WHERE id = $1',
    [foodItemId],
  );
  if (!row) throw notFound('Food item not found');
  return row.groupId;
}
