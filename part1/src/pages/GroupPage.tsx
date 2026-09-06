import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Users, Copy, Check, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FoodCard } from '../components/FoodCard';
import { AddFoodModal } from '../components/AddFoodModal';
import { getGradient } from '../components/GroupCard';
import styles from './GroupPage.module.css';

export function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { state } = useApp();
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const group = state.groups.find(g => g.id === groupId);
  if (!group) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>Group not found.</p>
        <Link to="/" className="btn btn-ghost" style={{ marginTop: 16, display: 'inline-flex' }}>
          Go Home
        </Link>
      </div>
    );
  }

  const categories = ['All', ...Array.from(new Set(group.foodItems.map(f => f.category)))];

  const filtered = group.foodItems.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'All' || f.category === activeCategory;
    return matchSearch && matchCat;
  });

  const copyInvite = () => {
    navigator.clipboard.writeText(group.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={styles.page}>
      {/* Header banner */}
      <div className={styles.banner} style={{ background: getGradient(group.color) }}>
        <div className={styles.bannerOverlay} />
        <div className={styles.bannerContent}>
          <button
            className={styles.backBtn}
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={16} />
            All Groups
          </button>
          <div className={styles.groupEmoji}>{group.emoji}</div>
          <h1 className={`${styles.groupName} font-display`}>{group.name}</h1>
          {group.description && (
            <p className={styles.groupDesc}>{group.description}</p>
          )}

          <div className={styles.bannerMeta}>
            <div className={styles.members}>
              {group.members.slice(0, 6).map(m => (
                <div
                  key={m.id}
                  className="avatar avatar-sm"
                  style={{ background: m.color + '55', border: '2px solid rgba(255,255,255,0.3)' }}
                  title={m.name}
                >
                  {m.avatar}
                </div>
              ))}
              <span className={styles.memberCount}>
                <Users size={12} />
                {group.members.length}
              </span>
            </div>

            <button className={styles.inviteBtn} onClick={copyInvite}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? 'Copied!' : group.inviteCode}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            className={styles.searchInput}
            placeholder="Search food items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.categories}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`${styles.catBtn} ${activeCategory === cat ? styles.catActive : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={15} />
          Add Food
        </button>
      </div>

      {/* Food grid */}
      <div className={styles.content}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <span style={{ fontSize: 52 }}>🍽️</span>
            <p style={{ fontSize: 16, color: 'var(--text-muted)' }}>
              {group.foodItems.length === 0
                ? 'No food items yet. Be the first to add one!'
                : 'No items match your filter.'}
            </p>
            {group.foodItems.length === 0 && (
              <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                <Plus size={15} />
                Add First Item
              </button>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map(f => <FoodCard key={f.id} food={f} groupId={group.id} />)}
          </div>
        )}
      </div>

      {showAdd && <AddFoodModal groupId={group.id} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
