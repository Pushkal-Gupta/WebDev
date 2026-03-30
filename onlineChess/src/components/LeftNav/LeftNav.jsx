import styles from './LeftNav.module.css';
import useAuthStore from '../../store/authStore';

function NavItem({ icon, label, active, onClick }) {
  return (
    <li>
      <button
        className={`${styles.item} ${active ? styles.itemActive : ''}`}
        onClick={onClick}
      >
        <span className={styles.icon}>{icon}</span>
        <span className={styles.label}>{label}</span>
      </button>
    </li>
  );
}

const PlaySvg = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M9 3a7 7 0 100 14A7 7 0 009 3zm-1 4l5 3-5 3V7z"/>
  </svg>
);

const AnalysisSvg = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <rect x="2" y="12" width="3" height="6" rx="1"/>
    <rect x="8" y="8" width="3" height="10" rx="1"/>
    <rect x="14" y="4" width="3" height="14" rx="1"/>
    <path d="M3.5 11.5l5-4.5 4 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ComputerSvg = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="2" y="3" width="16" height="11" rx="1.5"/>
    <path d="M6 17h8M10 14v3"/>
    <path d="M7 8l2 2 4-4"/>
  </svg>
);

const OnlineSvg = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="10" cy="10" r="7.5"/>
    <path d="M10 2.5S7.5 5.5 7.5 10s2.5 7.5 2.5 7.5S12.5 14.5 12.5 10 10 2.5 10 2.5z"/>
    <path d="M2.5 10h15"/>
  </svg>
);

const AccountSvg = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <circle cx="10" cy="7" r="3.5"/>
    <path d="M3.5 17c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" strokeLinecap="round"/>
  </svg>
);

export default function LeftNav({ activeTab, onTabClick }) {
  const { username, user } = useAuthStore();
  const accountLabel = username || (user ? user.email?.split('@')[0] : 'Login');

  return (
    <aside className={styles.nav}>
      <a href="../../PG/main.html" className={styles.logo}>
        <span className={styles.logoIcon}>♟</span>
        <span className={styles.logoText}>PG.Chess</span>
      </a>

      <ul className={styles.list}>
        <NavItem icon={<PlaySvg />}     label="Play"     active={activeTab === 0 || activeTab === 1} onClick={() => onTabClick(0)} />
        <NavItem icon={<AnalysisSvg />} label="Analysis" active={activeTab === 2}                    onClick={() => onTabClick(2)} />
        <NavItem icon={<ComputerSvg />} label="Computer" active={activeTab === 3}                    onClick={() => onTabClick(3)} />
        <NavItem icon={<OnlineSvg />}   label="Online"   active={activeTab === 4}                    onClick={() => onTabClick(4)} />
      </ul>

      <div className={styles.bottom}>
        <ul className={styles.list}>
          <NavItem icon={<AccountSvg />} label={accountLabel} active={activeTab === 5} onClick={() => onTabClick(5)} />
        </ul>
      </div>
    </aside>
  );
}
