import { Star } from 'lucide-react';

interface Props {
  value: number; // average rating
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  count?: number;
}

export function StarDisplay({ value, size = 'md', showValue = true, count }: Props) {
  const px = size === 'sm' ? 12 : size === 'lg' ? 20 : 15;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map(i => {
        const filled = i <= Math.round(value);
        return (
          <Star
            key={i}
            size={px}
            fill={filled ? 'var(--accent)' : 'transparent'}
            color={filled ? 'var(--accent)' : 'var(--text-muted)'}
            style={{ transition: 'all 150ms' }}
          />
        );
      })}
      {showValue && value > 0 && (
        <span style={{ fontSize: px - 2, color: 'var(--text-secondary)', marginLeft: 4, fontWeight: 600 }}>
          {value.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span style={{ fontSize: px - 3, color: 'var(--text-muted)' }}>
          ({count})
        </span>
      )}
    </div>
  );
}

interface InputProps {
  value: number;
  onChange: (v: number) => void;
}

export function StarInput({ value, onChange }: InputProps) {
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            transition: 'transform 150ms',
            transform: i <= value ? 'scale(1.15)' : 'scale(1)',
          }}
        >
          <Star
            size={28}
            fill={i <= value ? 'var(--accent)' : 'transparent'}
            color={i <= value ? 'var(--accent)' : 'var(--text-muted)'}
          />
        </button>
      ))}
    </div>
  );
}
