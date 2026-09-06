import type { Group, FoodItem } from '../types';

const MEMBER_ALEX = { id: 'm1', name: 'Alex', avatar: '🌮', color: '#ef4444' };
const MEMBER_PRIYA = { id: 'm2', name: 'Priya', avatar: '🍜', color: '#8b5cf6' };
const MEMBER_JO = { id: 'm3', name: 'Jo', avatar: '🍣', color: '#06b6d4' };
const MEMBER_SAM = { id: 'm4', name: 'Sam', avatar: '🍔', color: '#10b981' };

const sushi: FoodItem = {
  id: 'food1',
  name: 'Spicy Tuna Roll',
  description: 'Perfectly spiced tuna with a delicate balance of heat and umami. The rice was seasoned well and the nori was crisp.',
  category: 'Seafood',
  imageUrl: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=800&auto=format&fit=crop',
  addedBy: 'm1',
  addedByName: 'Alex',
  createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
  reviews: [
    {
      id: 'r1', memberId: 'm1', memberName: 'Alex', memberAvatar: '🌮', memberColor: '#ef4444',
      rating: 5, text: 'Absolutely fire 🔥 best sushi I\'ve had in the city.',
      createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(), likes: ['m2', 'm3'],
    },
    {
      id: 'r2', memberId: 'm2', memberName: 'Priya', memberAvatar: '🍜', memberColor: '#8b5cf6',
      rating: 4, text: 'Loved the spice level! The avocado was a nice touch too.',
      createdAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString(), likes: ['m1'],
    },
  ],
  comments: [
    {
      id: 'c1', memberId: 'm3', memberName: 'Jo', memberAvatar: '🍣', memberColor: '#06b6d4',
      text: 'Can\'t wait to try this. Is it at Sakura downtown?',
      createdAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString(), likes: [],
    },
    {
      id: 'c2', memberId: 'm1', memberName: 'Alex', memberAvatar: '🌮', memberColor: '#ef4444',
      text: 'Yes! Table 8 near the window gives the best vibe too.',
      createdAt: new Date(Date.now() - 18 * 3600000).toISOString(), likes: ['m3'],
    },
  ],
};

const biryani: FoodItem = {
  id: 'food2',
  name: 'Dum Biryani',
  description: 'Slow-cooked aromatic basmati rice layered with tender chicken and saffron. A crowd favourite.',
  category: 'Main Course',
  imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop',
  addedBy: 'm2',
  addedByName: 'Priya',
  createdAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
  reviews: [
    {
      id: 'r3', memberId: 'm2', memberName: 'Priya', memberAvatar: '🍜', memberColor: '#8b5cf6',
      rating: 5, text: 'This is the real deal. The raita on the side was impeccable.',
      createdAt: new Date(Date.now() - 4 * 24 * 3600000).toISOString(), likes: ['m1', 'm4'],
    },
    {
      id: 'r4', memberId: 'm4', memberName: 'Sam', memberAvatar: '🍔', memberColor: '#10b981',
      rating: 4, text: 'A bit salty for my taste but the aroma is unmatched.',
      createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(), likes: [],
    },
  ],
  comments: [
    {
      id: 'c3', memberId: 'm4', memberName: 'Sam', memberAvatar: '🍔', memberColor: '#10b981',
      text: 'We need a group dinner here ASAP!',
      createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(), likes: ['m1', 'm2', 'm3'],
    },
  ],
};

const donut: FoodItem = {
  id: 'food3',
  name: 'Matcha Glazed Donut',
  description: 'Fluffy ring donut with a vibrant matcha glaze and white chocolate drizzle. A visual treat.',
  category: 'Dessert',
  imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&auto=format&fit=crop',
  addedBy: 'm3',
  addedByName: 'Jo',
  createdAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
  reviews: [
    {
      id: 'r5', memberId: 'm3', memberName: 'Jo', memberAvatar: '🍣', memberColor: '#06b6d4',
      rating: 4, text: 'The matcha isn\'t too bitter and the glaze is just the right sweetness.',
      createdAt: new Date(Date.now() - 12 * 3600000).toISOString(), likes: ['m2'],
    },
  ],
  comments: [],
};

export const SEED_DATA: Group[] = [
  {
    id: 'group1',
    name: 'The Hungry Squad',
    description: 'Our little crew discovering the best food spots in the city, one bite at a time.',
    emoji: '🍽️',
    color: 'from-amber-500 to-orange-600',
    inviteCode: 'SQUAD1',
    createdAt: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
    members: [MEMBER_ALEX, MEMBER_PRIYA, MEMBER_JO, MEMBER_SAM],
    foodItems: [sushi, biryani, donut],
  },
  {
    id: 'group2',
    name: 'Dessert Addicts 🍰',
    description: 'Life is short, eat dessert first. A group for sweet tooth adventurers.',
    emoji: '🍰',
    color: 'from-pink-500 to-rose-600',
    inviteCode: 'SWEET2',
    createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
    members: [MEMBER_PRIYA, MEMBER_JO],
    foodItems: [],
  },
];
