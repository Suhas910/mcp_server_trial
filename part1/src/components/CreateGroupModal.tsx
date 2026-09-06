import { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

interface Props {
  onClose: () => void;
}

const COLORS = [
  { label: 'Amber', value: 'from-amber-500 to-orange-600' },
  { label: 'Pink', value: 'from-pink-500 to-rose-600' },
  { label: 'Violet', value: 'from-violet-500 to-purple-600' },
  { label: 'Emerald', value: 'from-emerald-500 to-teal-600' },
  { label: 'Sky', value: 'from-sky-500 to-blue-600' },
  { label: 'Red', value: 'from-red-500 to-orange-600' },
];

const GRADIENT_CSS: Record<string, string> = {
  'from-amber-500 to-orange-600': 'linear-gradient(135deg,#f59e0b,#ea580c)',
  'from-pink-500 to-rose-600': 'linear-gradient(135deg,#ec4899,#e11d48)',
  'from-violet-500 to-purple-600': 'linear-gradient(135deg,#8b5cf6,#9333ea)',
  'from-emerald-500 to-teal-600': 'linear-gradient(135deg,#10b981,#0d9488)',
  'from-sky-500 to-blue-600': 'linear-gradient(135deg,#0ea5e9,#2563eb)',
  'from-red-500 to-orange-600': 'linear-gradient(135deg,#ef4444,#ea580c)',
};

const EMOJIS = ['🍽️','🍕','🍣','🌮','🍜','🍔','🍰','🥗','🍷','🍺','🥘','🫕'];

export function CreateGroupModal({ onClose }: Props) {
  const { createGroup } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🍽️');
  const [color, setColor] = useState(COLORS[0].value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const group = createGroup(name.trim(), description.trim(), emoji, color);
    onClose();
    navigate(`/groups/${group.id}`);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:22 }}>Create a Group</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {/* Emoji picker */}
          <div className="form-group">
            <label className="form-label">Group Icon</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {EMOJIS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  style={{
                    width:40, height:40, borderRadius:10, fontSize:20,
                    background: emoji === e ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                    border: emoji === e ? '2px solid var(--accent)' : '2px solid transparent',
                    cursor:'pointer', transition:'all 150ms',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="form-group">
            <label className="form-label">Group Name</label>
            <input
              className="form-input"
              placeholder="e.g. The Hungry Squad"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              placeholder="What's this group all about?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              maxLength={200}
            />
          </div>

          {/* Color */}
          <div className="form-group">
            <label className="form-label">Accent Color</label>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  title={c.label}
                  style={{
                    width:32, height:32, borderRadius:'50%',
                    background: GRADIENT_CSS[c.value],
                    border: color === c.value ? '3px solid var(--accent)' : '3px solid transparent',
                    cursor:'pointer', transition:'all 150ms',
                    boxShadow: color === c.value ? '0 0 0 2px var(--bg-surface)' : 'none',
                    outline: color === c.value ? '2px solid var(--accent)' : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div style={{
            height:70, borderRadius:12,
            background: GRADIENT_CSS[color],
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:40,
          }}>
            {emoji}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'13px' }}>
            Create Group
          </button>
        </form>
      </div>
    </div>
  );
}
