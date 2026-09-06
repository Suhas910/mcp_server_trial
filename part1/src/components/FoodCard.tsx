import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import type { FoodItem } from '../types';
import { StarDisplay } from './StarRating';
import styles from './FoodCard.module.css';

interface Props {
  food: FoodItem;
  groupId: string;
}

function avgRating(food: FoodItem): number {
  if (!food.reviews.length) return 0;
  return food.reviews.reduce((a, r) => a + r.rating, 0) / food.reviews.length;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Appetizer': '#f59e0b',
  'Main Course': '#ef4444',
  'Dessert': '#ec4899',
  'Beverage': '#06b6d4',
  'Snack': '#84cc16',
  'Breakfast': '#f97316',
  'Street Food': '#eab308',
  'Bakery': '#a78bfa',
  'Seafood': '#0ea5e9',
  'Vegetarian': '#10b981',
  'Other': '#78716c',
};

export function FoodCard({ food, groupId }: Props) {
  const navigate = useNavigate();
  const avg = avgRating(food);
  const catColor = CATEGORY_COLORS[food.category] ?? '#78716c';

  return (
    <div
      className={styles.card}
      onClick={() => navigate(`/groups/${groupId}/food/${food.id}`)}
    >
      <div className={styles.imgWrapper}>
        {food.imageUrl ? (
          <img src={food.imageUrl} alt={food.name} className={styles.img} />
        ) : (
          <div className={styles.imgFallback}>🍽️</div>
        )}
        <div className={styles.categoryBadge} style={{ color: catColor, borderColor: catColor + '40', background: catColor + '18' }}>
          {food.category}
        </div>
      </div>

      <div className={styles.body}>
        <h4 className={styles.name}>{food.name}</h4>
        <p className={styles.desc}>{food.description}</p>

        <div className={styles.footer}>
          {avg > 0 ? (
            <StarDisplay value={avg} size="sm" count={food.reviews.length} />
          ) : (
            <span className={styles.noRating}>No reviews yet</span>
          )}
          <div className={styles.commentCount}>
            <MessageCircle size={12} />
            <span>{food.comments.length}</span>
          </div>
        </div>

        <div className={styles.addedBy}>
          Added by <strong>{food.addedByName}</strong>
        </div>
      </div>
    </div>
  );
}
