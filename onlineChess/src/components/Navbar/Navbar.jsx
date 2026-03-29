import styles from './Navbar.module.css';
import useAuthStore from '../../store/authStore';

const NAV_ITEMS = [
  { label: 'Time Limit', icon: '⏳' },
  { label: 'New Game', icon: '📂' },
  { label: 'Analysis', icon: '✏️' },
  { label: 'Computer', icon: '💻' },
  { label: 'My Account', icon: '👤' },
];

export default function Navbar({ activeTab, onTabClick }) {
  const { username } = useAuthStore();

  return (
    <nav className={styles.navbar}>
      <a className={styles.brand} href="../PG/main.html">PG.Chess</a>
      <ul className={styles.navList}>
        {NAV_ITEMS.map((item, index) => {
          const label = index === 4 ? (username || 'My Account') : item.label;
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
