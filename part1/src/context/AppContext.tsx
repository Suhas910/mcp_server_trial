import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AppState, Comment, FoodItem, Group, Review } from '../types';
import { useAuth } from './AuthContext';
import * as authApi from '../api/auth';
import * as foodsApi from '../api/foods';
import * as groupsApi from '../api/groups';
import { ApiError } from '../api/client';

interface AppContextType {
  state: AppState;
  isLoading: boolean;
  /** Set when the initial group load fails (e.g. the API is unreachable). */
  error: string | null;
  refresh: () => Promise<void>;
  createGroup: (name: string, description: string, emoji: string, color: string) => Promise<Group>;
  /** Resolves to null when the code doesn't match any group, rather than throwing. */
  joinGroup: (inviteCode: string) => Promise<Group | null>;
  addFoodItem: (
    groupId: string,
    item: Omit<FoodItem, 'id' | 'createdAt' | 'reviews' | 'comments' | 'addedBy' | 'addedByName'>,
  ) => Promise<void>;
  addReview: (groupId: string, foodId: string, rating: number, text: string) => Promise<void>;
  likeReview: (groupId: string, foodId: string, reviewId: string) => Promise<void>;
  addComment: (groupId: string, foodId: string, text: string) => Promise<void>;
  likeComment: (groupId: string, foodId: string, commentId: string) => Promise<void>;
  updateCurrentUser: (name: string, avatar: string, color: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

/** Splices an updated food item's review list back in, keyed by the review's stable id. */
function withReview(foodItem: FoodItem, review: Review): FoodItem {
  const exists = foodItem.reviews.some(r => r.id === review.id);
  return {
    ...foodItem,
    reviews: exists
      ? foodItem.reviews.map(r => (r.id === review.id ? review : r))
      : [review, ...foodItem.reviews],
  };
}

function withComment(foodItem: FoodItem, comment: Comment): FoodItem {
  const exists = foodItem.comments.some(c => c.id === comment.id);
  return {
    ...foodItem,
    comments: exists
      ? foodItem.comments.map(c => (c.id === comment.id ? comment : c))
      : [...foodItem.comments, comment],
  };
}

/**
 * GET /groups returns every group the caller belongs to, fully nested
 * (members, food items, reviews, comments) in one call — so a single fetch on
 * mount populates the whole app, and every mutation below patches this local
 * cache from the sub-resource the API hands back instead of refetching.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const { user, setUser } = useAuth();

  if (!user) {
    // AppProvider only ever mounts behind the RequireAuth guard in App.tsx —
    // this is a programming-error guard, not a real runtime path. It also lets
    // TypeScript narrow `user` below instead of every read needing `user!`.
    throw new Error('AppProvider requires an authenticated user');
  }

  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setGroups(await groupsApi.listGroups());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load your groups.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    // Re-run if the logged-in user changes (e.g. logout then a different login),
    // so one account's groups never linger after switching accounts.
  }, [refresh, user.id]);

  const withGroup = (groupId: string, update: (group: Group) => Group) =>
    setGroups(gs => gs.map(g => (g.id === groupId ? update(g) : g)));

  const withFoodItem = (groupId: string, foodId: string, update: (item: FoodItem) => FoodItem) =>
    withGroup(groupId, g => ({
      ...g,
      foodItems: g.foodItems.map(f => (f.id === foodId ? update(f) : f)),
    }));

  const createGroup = async (
    name: string,
    description: string,
    emoji: string,
    color: string,
  ): Promise<Group> => {
    const group = await groupsApi.createGroup({ name, description, emoji, color });
    setGroups(gs => [group, ...gs]);
    return group;
  };

  const joinGroup = async (inviteCode: string): Promise<Group | null> => {
    try {
      const group = await groupsApi.joinGroup(inviteCode);
      setGroups(gs => (gs.some(g => g.id === group.id) ? gs.map(g => (g.id === group.id ? group : g)) : [group, ...gs]));
      return group;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  };

  const addFoodItem: AppContextType['addFoodItem'] = async (groupId, item) => {
    const foodItem = await foodsApi.addFoodItem(groupId, item);
    withGroup(groupId, g => ({ ...g, foodItems: [foodItem, ...g.foodItems] }));
  };

  const addReview = async (groupId: string, foodId: string, rating: number, text: string) => {
    const review = await foodsApi.addReview(foodId, rating, text);
    withFoodItem(groupId, foodId, f => withReview(f, review));
  };

  const likeReview = async (groupId: string, foodId: string, reviewId: string) => {
    const review = await foodsApi.likeReview(reviewId);
    withFoodItem(groupId, foodId, f => withReview(f, review));
  };

  const addComment = async (groupId: string, foodId: string, text: string) => {
    const comment = await foodsApi.addComment(foodId, text);
    withFoodItem(groupId, foodId, f => withComment(f, comment));
  };

  const likeComment = async (groupId: string, foodId: string, commentId: string) => {
    const comment = await foodsApi.likeComment(commentId);
    withFoodItem(groupId, foodId, f => withComment(f, comment));
  };

  const updateCurrentUser = async (name: string, avatar: string, color: string) => {
    setUser(await authApi.updateProfile({ name, avatar, color }));
    // Reviews/comments this user already posted keep their old denormalised
    // memberName/memberAvatar/memberColor until the next refresh() — the same
    // "old posts don't retroactively relabel" behaviour a rename has anywhere.
  };

  const state: AppState = { currentUser: user, groups };

  return (
    <AppContext.Provider
      value={{
        state,
        isLoading,
        error,
        refresh,
        createGroup,
        joinGroup,
        addFoodItem,
        addReview,
        likeReview,
        addComment,
        likeComment,
        updateCurrentUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
