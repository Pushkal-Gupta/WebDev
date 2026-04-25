// Footer — boutique site closer.
//
// Four columns at desktop, single column on mobile.
//   1. Brand wordmark + tagline + author line.
//   2. Games — every playable title.
//   3. About — Pushkal's site, mailto, privacy.
//   4. System status — small pulsing dot.
// Bottom strip carries copyright, an aphorism, theme toggle, privacy link.
// No new deps; pure links + a click-handler for the theme toggle.

import { useNavigate } from 'react-router-dom';
import { GAMES } from '../data.js';
import { Icon } from '../icons.jsx';

const SUN = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
  </svg>
);

const MOON = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>
  </svg>
);

const MAIL = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2"/>
    <path d="m3 7 9 6 9-6"/>
  </svg>
);

export default function Footer({ theme, onToggleTheme }) {
  const navigate = useNavigate();
  const playable = GAMES.filter((g) => g.playable);
  const year = new Date().getFullYear();

  return (
    <footer className="footer-v2" role="contentinfo">
      <div className="footer-divider glass" aria-hidden="true"/>

      <div className="footer-grid">
        {/* Brand */}
        <div className="footer-col footer-col-brand">
          <div className="footer-wordmark">PG.Play</div>
          <p className="footer-tagline">
            A boutique browser arcade. Hand-built games, no ads, no signup wall.
          </p>
          <p className="footer-author">
            Made by{' '}
            <a className="footer-link" href="https://pushkalgupta.com" target="_blank" rel="noreferrer">
              Pushkal Gupta
            </a>
            <span className="footer-dot-sep" aria-hidden="true">·</span>
            <a className="footer-link footer-link-mute" href="https://pushkalgupta.com" target="_blank" rel="noreferrer">
              pushkalgupta.com
            </a>
          </p>
        </div>

        {/* Games */}
        <nav className="footer-col" aria-label="Games">
          <div className="footer-col-title">Games</div>
          <ul className="footer-list">
            {playable.map((g) => (
              <li key={g.id}>
                <button
                  className="footer-link footer-link-btn"
                  onClick={() => navigate(`/game/${g.id}`)}>
                  {g.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* About */}
        <nav className="footer-col" aria-label="About">
          <div className="footer-col-title">About</div>
          <ul className="footer-list">
            <li>
              <a className="footer-link" href="https://pushkalgupta.com" target="_blank" rel="noreferrer">
                Author site
              </a>
            </li>
            <li>
              <a className="footer-link" href="mailto:pushkalgupta2005@gmail.com">
                <span className="footer-inline-icon">{MAIL}</span>
                Contact
              </a>
            </li>
            <li>
              <button
                className="footer-link footer-link-btn"
                onClick={() => navigate('/about')}>
                Privacy
              </button>
            </li>
          </ul>
        </nav>

        {/* Status */}
        <div className="footer-col">
          <div className="footer-col-title">Status</div>
          <div className="footer-status">
            <span className="status-dot" aria-hidden="true"/>
            <span>All systems operational</span>
          </div>
          <div className="footer-status-sub">
            Realtime, leaderboards, and edge functions reporting healthy.
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span className="footer-copy">
          © <span className="numeric">{year}</span> PG.Play
        </span>
        <span className="footer-aphorism">Made with deliberate care.</span>
        <span className="footer-bottom-actions">
          {onToggleTheme && (
            <button
              type="button"
              className="footer-theme-toggle"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
              <span className="footer-theme-icon" aria-hidden="true">
                {theme === 'dark' ? SUN : MOON}
              </span>
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          )}
          <button className="footer-link footer-link-btn" onClick={() => navigate('/about')}>
            Privacy
          </button>
        </span>
      </div>
    </footer>
  );
}
