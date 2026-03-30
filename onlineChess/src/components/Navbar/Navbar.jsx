import styles from './Navbar.module.css';
import useAuthStore from '../../store/authStore';

const NAV_ITEMS = [
  { label: 'New Game',  icon: '♟' },
  { label: 'Analysis', icon: '✏' },
  { label: 'Computer', icon: '⚙' },
  { label: 'Online',   icon: '🌐' },
  { label: 'Account',  icon: '◉' },
];

export default function Navbar({ activeTab, onTabClick }) {
  const { username } = useAuthStore();

  return (
    <nav className={styles.navbar}>
      <a className={styles.brand} href="../../PG/main.html">PG.Chess</a>
      <ul className={styles.navList}>
        {NAV_ITEMS.map((item, i) => {
          const index = i + 1;
          const label = index === 5 ? (username || 'Account') : item.label;
          return (
            <li key={index} className={styles.navItem}>
              <button
                className={`${styles.navLink} ${activeTab === index ? styles.active : ''}`}
                onClick={() => onTabClick(index)}
              >
                <span className={styles.icon}>{item.icon}</span>
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
