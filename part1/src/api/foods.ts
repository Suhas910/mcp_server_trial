import { request } from './client';
import type { Comment, FoodCategory, FoodItem, Review } from '../types';

export async function addFoodItem(
  groupId: string,
  input: { name: string; description: string; category: FoodCategory; imageUrl: string },
): Promise<FoodItem> {
  const { foodItem } = await request<{ foodItem: FoodItem }>(`/groups/${groupId}/foods`, {
    method: 'POST',
    body: input,
  });
  return foodItem;
}

/** Upserts — the API keeps one review per member and updates it on re-submit. */
export async function addReview(foodId: string, rating: number, text: string): Promise<Review> {
  const { review } = await request<{ review: Review }>(`/foods/${foodId}/reviews`, {
    method: 'POST',
    body: { rating, text },
  });
  return review;
}

export async function likeReview(reviewId: string): Promise<Review> {
  const { review } = await request<{ review: Review }>(`/reviews/${reviewId}/like`, { method: 'POST' });
  return review;
}

export async function addComment(foodId: string, text: string): Promise<Comment> {
  const { comment } = await request<{ comment: Comment }>(`/foods/${foodId}/comments`, {
    method: 'POST',
    body: { text },
  });
  return comment;
}

export async function likeComment(commentId: string): Promise<Comment> {
  const { comment } = await request<{ comment: Comment }>(`/comments/${commentId}/like`, {
    method: 'POST',
  });
  return comment;
}
