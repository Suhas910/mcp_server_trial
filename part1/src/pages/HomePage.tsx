import { useState } from 'react';
import { Plus, LogIn, Search, UtensilsCrossed } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GroupCard } from '../components/GroupCard';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { useNavigate } from 'react-router-dom';
import styles from './HomePage.module.css';

export function HomePage() {
  const { state, joinGroup } = useApp();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [search, setSearch] = useState('');

  const filtered = state.groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const group = joinGroup(joinCode.trim());
    if (group) {
      setShowJoin(false);
      setJoinCode('');
      navigate(`/groups/${group.id}`);
    } else {
      setJoinError('No group found with that code');
    }
  };

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.heroIcon}>
            <UtensilsCrossed size={32} />
          </div>
          <h1 className={`${styles.heroTitle} font-display`}>
            Discover Food<br />
            <span className={styles.heroAccent}>with Your Crew</span>
          </h1>
          <p className={styles.heroSub}>
            Create groups, share food discoveries, rate dishes and chat — all in one place.
          </p>
          <div className={styles.heroCtas}>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={16} />
              New Group
            </button>
            <button className="btn btn-ghost" onClick={() => setShowJoin(v => !v)}>
              <LogIn size={16} />
              Join Group
            </button>
          </div>

          {showJoin && (
            <form onSubmit={handleJoin} className={styles.joinForm}>
              <input
                className="form-input"
                placeholder="Enter invite code (e.g. SQUAD1)"
                value={joinCode}
                onChange={e => { setJoinCode(e.target.value); setJoinError(''); }}
                style={{ flex:1 }}
                autoFocus
              />
              <button className="btn btn-primary" type="submit">Join</button>
              {joinError && <p style={{ color:'var(--danger)', fontSize:13, width:'100%' }}>{joinError}</p>}
            </form>
          )}
        </div>
      </div>

      {/* Groups */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Your Groups</h2>
          <div className={styles.searchBox}>
            <Search size={14} style={{ color:'var(--text-muted)', flexShrink:0 }} />
            <input
              className={styles.searchInput}
              placeholder="Search groups..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <span style={{ fontSize:48 }}>🍽️</span>
            <p>No groups yet. Create one or join with an invite code!</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map(g => <GroupCard key={g.id} group={g} />)}
          </div>
        )}
      </div>

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
