import { Link, useLocation } from 'react-router-dom';
import { UtensilsCrossed, Home, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './Navbar.module.css';

export function Navbar() {
  const { state } = useApp();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}><UtensilsCrossed size={20} /></span>
          <span className={styles.logoText}>FoodGroups</span>
        </Link>

        <div className={styles.links}>
          <Link to="/" className={`${styles.link} ${isActive('/') ? styles.active : ''}`}>
            <Home size={16} />
            <span>Home</span>
          </Link>
          <Link
            to="/profile"
            className={`${styles.link} ${isActive('/profile') ? styles.active : ''}`}
          >
            <User size={16} />
            <span>Profile</span>
          </Link>
        </div>

        <Link to="/profile" className={styles.userChip}>
          <div
            className="avatar avatar-sm"
            style={{ background: state.currentUser.color + '33' }}
          >
            {state.currentUser.avatar}
          </div>
          <span className={styles.userName}>{state.currentUser.name}</span>
        </Link>
      </div>
    </nav>
  );
}
