// Shared primitives used across Goalbound screens.

import { Icon } from '../../../icons.jsx';

// Headline wrapper with animated kicker + title + optional blurb.
export function ScreenHead({ kicker, title, blurb, children }) {
  return (
    <header className="gb-head">
      <div className="gb-head-text">
        {kicker && <div className="gb-kicker">{kicker}</div>}
        <h1 className="gb-title">{title}</h1>
        {blurb && <p className="gb-blurb">{blurb}</p>}
      </div>
      {children && <div className="gb-head-aside">{children}</div>}
    </header>
  );
}

export function BackBar({ onBack, label = 'Back' }) {
  return (
    <button className="gb-back" onClick={onBack}>
      {Icon.back}<span>{label}</span>
    </button>
  );
}

// Generic selection card used by mode/team/player/diff screens.
export function Choice({
  title, subtitle, meta,
  selected = false, disabled = false,
  onClick, children, tone = 'default',
}) {
  return (
    <button
      type="button"
      className={`gb-choice gb-choice-${tone} ${selected ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}>
      <div className="gb-choice-body">
        {title && <div className="gb-choice-title">{title}</div>}
        {subtitle && <div className="gb-choice-sub">{subtitle}</div>}
        {children}
      </div>
      {meta && <div className="gb-choice-meta">{meta}</div>}
      <span className="gb-choice-ring" aria-hidden="true"/>
    </button>
  );
}

export function Pill({ children, tone = 'ghost' }) {
  return <span className={`gb-pill gb-pill-${tone}`}>{children}</span>;
}

export function Stat({ label, value }) {
  return (
    <div className="gb-stat">
      <div className="gb-stat-value">{value}</div>
      <div className="gb-stat-label">{label}</div>
    </div>
  );
}

export function SectionTitle({ children }) {
  return <h2 className="gb-section-title">{children}</h2>;
}

export function Divider() {
  return <div className="gb-divider"/>;
}

export function CyclerArrow({ dir, onClick, label }) {
  return (
    <button className={`gb-cycler gb-cycler-${dir}`} onClick={onClick} aria-label={label}>
      {dir === 'prev' ? Icon.back : Icon.play}
    </button>
  );
}

// Star bar used by the challenge screen.
export function Stars({ filled = 0, total = 3, tone = 'accent' }) {
  return (
    <div className={`gb-stars gb-stars-${tone}`} role="img" aria-label={`${filled} of ${total} stars`}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`gb-star ${i < filled ? 'is-on' : ''}`}>★</span>
      ))}
    </div>
  );
}

export function Kbd({ children }) {
  return <kbd className="gb-kbd">{children}</kbd>;
}
