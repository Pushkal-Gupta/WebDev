import { useState } from 'react';
import { Icon } from '../../icons.jsx';
import { GAMES } from '../../data.js';

const DEVICE_LABEL = {
  'native':        'Mobile native',
  'touch-ok':      'Touch supported',
  'desktop-first': 'Best on desktop',
  'desktop-only':  'Desktop only',
};

export default function CompanionPanel({
  game,
  mode,
  best,
  goals,
  tips,
  controls,
  stats,
  onOpen,
}) {
  const [tab, setTab] = useState(controls ? 'controls' : 'goals');

  const related = GAMES
    .filter((g) => g.id !== game.id && g.cat === game.cat && g.playable)
    .slice(0, 3);

  const tabs = [
    goals && { id: 'goals', label: 'Goals' },
    controls && { id: 'controls', label: 'Controls' },
    (tips && tips.length > 0) && { id: 'tips', label: 'Tips' },
    { id: 'stats', label: 'Stats' },
    related.length > 0 && { id: 'related', label: 'Related' },
  ].filter(Boolean);

  return (
    <aside className="shell-companion" aria-label="Game info">
      <div className="shell-companion-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            className={'shell-companion-tab' + (tab === t.id ? ' is-active' : '')}
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="shell-companion-body">
        {tab === 'goals' && goals && (
          <div className="shell-companion-section">
            <div className="shell-companion-kicker">What you're here to do</div>
            <p className="shell-companion-lead">{goals.lead}</p>
            {goals.bullets && (
              <ul className="shell-companion-list">
                {goals.bullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            )}
          </div>
        )}

        {tab === 'controls' && controls && (
          <div className="shell-companion-section">
            {controls.map((group, i) => (
              <div key={i} className="shell-companion-controls">
                <div className="shell-companion-controls-title">{group.title}</div>
                <ul className="shell-companion-keymap">
                  {group.items.map((it, j) => (
                    <li key={j}>
                      <span className="shell-companion-keys">
                        {it.keys.map((k, kk) => <kbd key={kk} className="shell-help-kbd">{k}</kbd>)}
                      </span>
                      <span>{it.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {tab === 'tips' && tips && (
          <div className="shell-companion-section">
            <ul className="shell-companion-list shell-companion-tips">
              {tips.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        )}

        {tab === 'stats' && (
          <div className="shell-companion-section">
            <div className="shell-companion-stat">
              <span className="shell-companion-stat-label">Mode</span>
              <span className="shell-companion-stat-value">{mode || '—'}</span>
            </div>
            <div className="shell-companion-stat">
              <span className="shell-companion-stat-label">Personal best</span>
              <span className="shell-companion-stat-value">{best ?? '—'}</span>
            </div>
            <div className="shell-companion-stat">
              <span className="shell-companion-stat-label">Session length</span>
              <span className="shell-companion-stat-value">{game.sessionLength || '—'}</span>
            </div>
            <div className="shell-companion-stat">
              <span className="shell-companion-stat-label">Device</span>
              <span className="shell-companion-stat-value">{DEVICE_LABEL[game.mobileSupport] || 'Any'}</span>
            </div>
            {stats && (
              <div className="shell-companion-stat-divider">
                {stats}
              </div>
            )}
          </div>
        )}

        {tab === 'related' && (
          <div className="shell-companion-section">
            <div className="shell-companion-kicker">More like this</div>
            <div className="shell-companion-related">
              {related.map((g) => (
                <button
                  key={g.id}
                  className="shell-companion-related-card"
                  onClick={() => onOpen?.(g)}>
                  <div className="shell-companion-related-title">
                    {Icon.chevronRight}
                    <span>{g.name}</span>
                  </div>
                  <div className="shell-companion-related-meta">{g.cat} · {g.tagline}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
