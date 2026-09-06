import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import type { Group } from '../types';
import { StarDisplay } from './StarRating';
import styles from './GroupCard.module.css';

interface Props {
  group: Group;
}

const GRADIENT_MAP: Record<string, string> = {
  'from-amber-500 to-orange-600': 'linear-gradient(135deg, #f59e0b, #ea580c)',
  'from-pink-500 to-rose-600': 'linear-gradient(135deg, #ec4899, #e11d48)',
  'from-violet-500 to-purple-600': 'linear-gradient(135deg, #8b5cf6, #9333ea)',
  'from-emerald-500 to-teal-600': 'linear-gradient(135deg, #10b981, #0d9488)',
  'from-sky-500 to-blue-600': 'linear-gradient(135deg, #0ea5e9, #2563eb)',
  'from-red-500 to-orange-600': 'linear-gradient(135deg, #ef4444, #ea580c)',
};

export function getGradient(color: string): string {
  return GRADIENT_MAP[color] ?? 'linear-gradient(135deg, #f59e0b, #ea580c)';
}

function avgRating(group: Group): number {
  const all = group.foodItems.flatMap(f => f.reviews.map(r => r.rating));
  if (!all.length) return 0;
  return all.reduce((a, b) => a + b, 0) / all.length;
}

export function GroupCard({ group }: Props) {
  const navigate = useNavigate();
  const avg = avgRating(group);

  return (
    <div className={styles.card} onClick={() => navigate(`/groups/${group.id}`)}>
      <div className={styles.header} style={{ background: getGradient(group.color) }}>
        <span className={styles.emoji}>{group.emoji}</span>
        <div className={styles.inviteChip}>
          <span className={styles.inviteLabel}>Code</span>
          <span className={styles.inviteCode}>{group.inviteCode}</span>
        </div>
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>{group.name}</h3>
        <p className={styles.description}>{group.description}</p>

        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <Users size={13} />
            <span>{group.members.length} member{group.members.length !== 1 ? 's' : ''}</span>
          </div>
          <div className={styles.metaItem}>
            <span>🍽️</span>
            <span>{group.foodItems.length} item{group.foodItems.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {avg > 0 && (
          <div style={{ marginTop: 8 }}>
            <StarDisplay value={avg} size="sm" count={group.foodItems.flatMap(f => f.reviews).length} />
          </div>
        )}

        <div className={styles.members}>
          {group.members.slice(0, 5).map(m => (
            <div
              key={m.id}
              className="avatar avatar-sm"
              style={{ background: m.color + '33', border: `2px solid ${m.color}55` }}
              title={m.name}
            >
              {m.avatar}
            </div>
          ))}
          {group.members.length > 5 && (
            <div className={`${styles.moreMembers} avatar avatar-sm`}>
              +{group.members.length - 5}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
