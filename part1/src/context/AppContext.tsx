import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AppState, Group, FoodItem, Review, Comment, Member } from '../types';
import { SEED_DATA } from './seedData';

const STORAGE_KEY = 'foodgroups_state';

interface AppContextType {
  state: AppState;
  // Group actions
  createGroup: (name: string, description: string, emoji: string, color: string) => Group;
  joinGroup: (inviteCode: string) => Group | null;
  // Food actions
  addFoodItem: (groupId: string, item: Omit<FoodItem, 'id' | 'createdAt' | 'reviews' | 'comments' | 'addedBy' | 'addedByName'>) => void;
  // Review actions
  addReview: (groupId: string, foodId: string, rating: number, text: string) => void;
  likeReview: (groupId: string, foodId: string, reviewId: string) => void;
  // Comment actions
  addComment: (groupId: string, foodId: string, text: string) => void;
  likeComment: (groupId: string, foodId: string, commentId: string) => void;
  // User
  updateCurrentUser: (name: string, avatar: string, color: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function generateInviteCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

const DEFAULT_USER: Member = {
  id: 'user-me',
  name: 'You',
  avatar: '🍕',
  color: '#f59e0b',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { currentUser: DEFAULT_USER, groups: SEED_DATA };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const createGroup = (name: string, description: string, emoji: string, color: string): Group => {
    const newGroup: Group = {
      id: generateId(),
      name,
      description,
      emoji,
      color,
      inviteCode: generateInviteCode(),
      createdAt: new Date().toISOString(),
      members: [state.currentUser],
      foodItems: [],
    };
    setState(s => ({ ...s, groups: [newGroup, ...s.groups] }));
    return newGroup;
  };

  const joinGroup = (inviteCode: string): Group | null => {
    const group = state.groups.find(g => g.inviteCode === inviteCode.toUpperCase());
    if (!group) return null;
    const alreadyMember = group.members.some(m => m.id === state.currentUser.id);
    if (!alreadyMember) {
      setState(s => ({
        ...s,
        groups: s.groups.map(g =>
          g.id === group.id
            ? { ...g, members: [...g.members, state.currentUser] }
            : g
        ),
      }));
    }
    return group;
  };

  const addFoodItem = (
    groupId: string,
    item: Omit<FoodItem, 'id' | 'createdAt' | 'reviews' | 'comments' | 'addedBy' | 'addedByName'>
  ) => {
    const newItem: FoodItem = {
      ...item,
      id: generateId(),
      createdAt: new Date().toISOString(),
      reviews: [],
      comments: [],
      addedBy: state.currentUser.id,
      addedByName: state.currentUser.name,
    };
    setState(s => ({
      ...s,
      groups: s.groups.map(g =>
        g.id === groupId ? { ...g, foodItems: [newItem, ...g.foodItems] } : g
      ),
    }));
  };

  const addReview = (groupId: string, foodId: string, rating: number, text: string) => {
    const newReview: Review = {
      id: generateId(),
      memberId: state.currentUser.id,
      memberName: state.currentUser.name,
      memberAvatar: state.currentUser.avatar,
      memberColor: state.currentUser.color,
      rating,
      text,
      createdAt: new Date().toISOString(),
      likes: [],
    };
    setState(s => ({
      ...s,
      groups: s.groups.map(g =>
        g.id === groupId
          ? {
              ...g,
              foodItems: g.foodItems.map(f =>
                f.id === foodId
                  ? {
                      ...f,
                      reviews: [
                        newReview,
                        ...f.reviews.filter(r => r.memberId !== state.currentUser.id),
                      ],
                    }
                  : f
              ),
            }
          : g
      ),
    }));
  };

  const likeReview = (groupId: string, foodId: string, reviewId: string) => {
    setState(s => ({
      ...s,
      groups: s.groups.map(g =>
        g.id === groupId
          ? {
              ...g,
              foodItems: g.foodItems.map(f =>
                f.id === foodId
                  ? {
                      ...f,
                      reviews: f.reviews.map(r =>
                        r.id === reviewId
                          ? {
                              ...r,
                              likes: r.likes.includes(s.currentUser.id)
                                ? r.likes.filter(id => id !== s.currentUser.id)
                                : [...r.likes, s.currentUser.id],
                            }
                          : r
                      ),
                    }
                  : f
              ),
            }
          : g
      ),
    }));
  };

  const addComment = (groupId: string, foodId: string, text: string) => {
    const newComment: Comment = {
      id: generateId(),
      memberId: state.currentUser.id,
      memberName: state.currentUser.name,
      memberAvatar: state.currentUser.avatar,
      memberColor: state.currentUser.color,
      text,
      createdAt: new Date().toISOString(),
      likes: [],
    };
    setState(s => ({
      ...s,
      groups: s.groups.map(g =>
        g.id === groupId
          ? {
              ...g,
              foodItems: g.foodItems.map(f =>
                f.id === foodId ? { ...f, comments: [...f.comments, newComment] } : f
              ),
            }
          : g
      ),
    }));
  };

  const likeComment = (groupId: string, foodId: string, commentId: string) => {
    setState(s => ({
      ...s,
      groups: s.groups.map(g =>
        g.id === groupId
          ? {
              ...g,
              foodItems: g.foodItems.map(f =>
                f.id === foodId
                  ? {
                      ...f,
                      comments: f.comments.map(c =>
                        c.id === commentId
                          ? {
                              ...c,
                              likes: c.likes.includes(s.currentUser.id)
                                ? c.likes.filter(id => id !== s.currentUser.id)
                                : [...c.likes, s.currentUser.id],
                            }
                          : c
                      ),
                    }
                  : f
              ),
            }
          : g
      ),
    }));
  };

  const updateCurrentUser = (name: string, avatar: string, color: string) => {
    setState(s => ({ ...s, currentUser: { ...s.currentUser, name, avatar, color } }));
  };

  return (
    <AppContext.Provider
      value={{
        state,
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
