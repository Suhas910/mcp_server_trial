export interface Member {
  id: string;
  name: string;
  avatar: string; // emoji or initials
  color: string; // bg color for avatar
}

export interface Review {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  memberColor: string;
  rating: number; // 1-5
  text: string;
  createdAt: string; // ISO date
  likes: string[]; // memberIds who liked
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

export type FoodCategory =
  | 'Appetizer'
  | 'Main Course'
  | 'Dessert'
  | 'Beverage'
  | 'Snack'
  | 'Breakfast'
  | 'Street Food'
  | 'Bakery'
  | 'Seafood'
  | 'Vegetarian'
  | 'Other';

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  category: FoodCategory;
  imageUrl: string;
  addedBy: string; // memberId
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
  color: string; // gradient accent
  inviteCode: string;
  createdAt: string;
  members: Member[];
  foodItems: FoodItem[];
}

export interface AppState {
  currentUser: Member;
  groups: Group[];
}
