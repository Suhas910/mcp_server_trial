import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { Check, LogOut } from 'lucide-react';
import styles from './ProfilePage.module.css';

const AVATARS = ['🍕','🍣','🌮','🍜','🍔','🍰','🥗','🍷','🍺','🥘','🫕','🍩','🍦','🧆','🥐'];
const COLORS = [
  '#f59e0b','#ef4444','#8b5cf6','#06b6d4','#10b981',
  '#f97316','#ec4899','#84cc16','#0ea5e9','#a78bfa',
];

export function ProfilePage() {
  const { state, updateCurrentUser } = useApp();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(state.currentUser.name);
  const [avatar, setAvatar] = useState(state.currentUser.avatar);
  const [color, setColor] = useState(state.currentUser.color);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setError('');
    setSaving(true);
    try {
      await updateCurrentUser(name.trim(), avatar, color);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const totalReviews = state.groups.flatMap(g => g.foodItems.flatMap(f => f.reviews)).filter(r => r.memberId === state.currentUser.id).length;
  const totalComments = state.groups.flatMap(g => g.foodItems.flatMap(f => f.comments)).filter(c => c.memberId === state.currentUser.id).length;
  const totalGroups = state.groups.filter(g => g.members.some(m => m.id === state.currentUser.id)).length;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={`${styles.title} font-display`}>Your Profile</h1>

        <div className={styles.layout}>
          {/* Stats */}
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{totalGroups}</span>
              <span className={styles.statLabel}>Groups</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{totalReviews}</span>
              <span className={styles.statLabel}>Reviews</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{totalComments}</span>
              <span className={styles.statLabel}>Comments</span>
            </div>
          </div>

          {/* Edit form */}
          <div className={styles.card}>
            {/* Preview */}
            <div className={styles.preview}>
              <div
                className="avatar avatar-lg"
                style={{ background: color + '33', border: `3px solid ${color}66`, fontSize: 32 }}
              >
                {avatar}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 18 }}>{name || 'Your Name'}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Your public display name</p>
              </div>
            </div>

            <hr className="divider" />

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input
                  className="form-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  maxLength={30}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Your Avatar Emoji</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {AVATARS.map(a => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAvatar(a)}
                      style={{
                        width: 40, height: 40, borderRadius: 10, fontSize: 20,
                        background: avatar === a ? color + '33' : 'var(--bg-elevated)',
                        border: avatar === a ? `2px solid ${color}` : '2px solid transparent',
                        cursor: 'pointer', transition: 'all 150ms',
                      }}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Avatar Color</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: c,
                        border: color === c ? '3px solid white' : '3px solid transparent',
                        cursor: 'pointer', transition: 'all 150ms',
                        outline: color === c ? `2px solid ${c}` : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
              </div>

              {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ alignSelf: 'flex-start', minWidth: 140, justifyContent: 'center', opacity: saving ? 0.6 : 1 }}
                >
                  {saving ? 'Saving…' : saved ? <><Check size={15} /> Saved!</> : 'Save Profile'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={handleLogout}>
                  <LogOut size={15} />
                  Log Out
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
