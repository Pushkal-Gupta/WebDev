import styles from './Navbar.module.css';
import useAuthStore from '../../store/authStore';

const NAV_ITEMS = [
  { label: 'New Game',   icon: '♟' },
  { label: 'Analysis',  icon: '✏️' },
  { label: 'Computer',  icon: '💻' },
  { label: 'Online',    icon: '🌐' },
  { label: 'My Account',icon: '👤' },
];

// Tab indices as shown in App.jsx: 0=Home, 1=NewGame, 2=Analysis, 3=Computer, 4=Online, 5=Account
// Navbar items map to indices 1-5

export default function Navbar({ activeTab, onTabClick }) {
  const { username } = useAuthStore();

  return (
    <nav className={styles.navbar}>
      <a className={styles.backLink} href="../../PG/main.html">← Home</a>
      <span className={styles.brand} onClick={() => onTabClick(0)}>PG.Chess</span>
      <ul className={styles.navList}>
        {NAV_ITEMS.map((item, i) => {
          const index = i + 1; // items are tabs 1-5
          const label = index === 5 ? (username || 'My Account') : item.label;
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
