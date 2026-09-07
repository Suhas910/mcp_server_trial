// Response shapes mirror part1/src/types/index.ts exactly, so the frontend
// wiring task can drop these straight into AppContext.

export interface Member {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export interface Review {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  memberColor: string;
  rating: number;
  text: string;
  createdAt: string;
  likes: string[];
}

export interface Comment {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  memberColor: string;
  text: string;
  createdAt: string;
  likes: string[];
}

export const FOOD_CATEGORIES = [
  'Appetizer',
  'Main Course',
  'Dessert',
  'Beverage',
  'Snack',
  'Breakfast',
  'Street Food',
  'Bakery',
  'Seafood',
  'Vegetarian',
  'Other',
] as const;

export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  category: FoodCategory;
  imageUrl: string;
  addedBy: string;
  addedByName: string;
  createdAt: string;
  reviews: Review[];
  comments: Comment[];
}

export interface Group {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  inviteCode: string;
  createdAt: string;
  members: Member[];
  foodItems: FoodItem[];
}

/** Set by requireAuth on every authenticated request. */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: Member;
    }
  }
}
