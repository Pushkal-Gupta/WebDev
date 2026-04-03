import styles from './LeftNav.module.css';
import useAuthStore from '../../store/authStore';

function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <li>
      <button
        className={`${styles.item} ${active ? styles.itemActive : ''}`}
        onClick={onClick}
      >
        <span className={styles.iconWrap}>
          {icon}
          {badge > 0 && <span className={styles.badge}>{badge > 9 ? '9+' : badge}</span>}
        </span>
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

const SpectateSvg = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6S1.5 10 1.5 10z"/>
    <circle cx="10" cy="10" r="2.5"/>
  </svg>
);

const FriendsSvg = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="7.5" cy="6.5" r="2.5"/>
    <path d="M2 17c0-3.04 2.46-5.5 5.5-5.5S13 13.96 13 17"/>
    <path d="M14.5 10a2 2 0 100-4 2 2 0 000 4z"/>
    <path d="M17.5 17c0-2.21-1.34-3.5-3-3.5"/>
  </svg>
);

const PuzzleSvg = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 00-2 2v3m5-5a2 2 0 014 0M8 3a2 2 0 014 0m0 0h3a2 2 0 012 2v3M3 8a2 2 0 000 4m0-4v4m0 0v3a2 2 0 002 2h3m-5-5a2 2 0 004 0m-4 0h4m0 0h3a2 2 0 002-2v-3m0 0a2 2 0 000-4m0 4v-4"/>
  </svg>
);

const ClubsSvg = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="5" r="2.5"/>
    <circle cx="4"  cy="14" r="2.5"/>
    <circle cx="16" cy="14" r="2.5"/>
    <path d="M10 7.5v2M7.2 12.8L8.5 9.5M12.8 12.8L11.5 9.5"/>
  </svg>
);

const TournamentSvg = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2h8v6a4 4 0 01-8 0V2z"/>
    <path d="M6 5H3a1 1 0 000 2c0 1.1.9 2 2 2"/>
    <path d="M14 5h3a1 1 0 010 2c0 1.1-.9 2-2 2"/>
    <path d="M10 12v4M7 18h6"/>
  </svg>
);

const LeaderboardSvg = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2l2.09 4.26L17 7.27l-3.5 3.41.83 4.82L10 13.27l-4.33 2.23.83-4.82L3 7.27l4.91-.71L10 2z"/>
  </svg>
);

const NearbySvg = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="2.5"/>
    <path d="M5.5 5.5a6.5 6.5 0 0 0 0 9M14.5 5.5a6.5 6.5 0 0 1 0 9"/>
    <path d="M2.5 2.5a11.5 11.5 0 0 0 0 15M17.5 2.5a11.5 11.5 0 0 1 0 15"/>
  </svg>
);

const TrainingSvg = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="7.5"/>
    <circle cx="10" cy="10" r="3"/>
    <circle cx="10" cy="10" r="0.5" fill="currentColor"/>
    <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2"/>
  </svg>
);

const AccountSvg = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <circle cx="10" cy="7" r="3.5"/>
    <path d="M3.5 17c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" strokeLinecap="round"/>
  </svg>
);

export default function LeftNav({ activeTab, onTabClick, friendBadge }) {
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
        <NavItem icon={<PuzzleSvg />}   label="Puzzles"  active={activeTab === 6}                    onClick={() => onTabClick(6)} />
        <NavItem icon={<SpectateSvg />} label="Spectate" active={activeTab === 7}                    onClick={() => onTabClick(7)} />
        <NavItem icon={<FriendsSvg />}      label="Friends"     active={activeTab === 8} badge={friendBadge} onClick={() => onTabClick(8)} />
        <NavItem icon={<ClubsSvg />}        label="Clubs"       active={activeTab === 9}  onClick={() => onTabClick(9)} />
        <NavItem icon={<TournamentSvg />}   label="Tournaments" active={activeTab === 10} onClick={() => onTabClick(10)} />
        <NavItem icon={<LeaderboardSvg />}  label="Leaderboard" active={activeTab === 11} onClick={() => onTabClick(11)} />
        <NavItem icon={<TrainingSvg />}      label="Training"    active={activeTab === 13} onClick={() => onTabClick(13)} />
        <NavItem icon={<NearbySvg />}        label="Nearby"      active={activeTab === 12} onClick={() => onTabClick(12)} />
      </ul>

      <div className={styles.bottom}>
        <ul className={styles.list}>
          <NavItem icon={<AccountSvg />} label={accountLabel} active={activeTab === 5} onClick={() => onTabClick(5)} />
        </ul>
      </div>
    </aside>
  );
}
