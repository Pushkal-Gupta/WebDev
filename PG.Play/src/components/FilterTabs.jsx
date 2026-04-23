import { FILTERS } from '../data.js';

export default function FilterTabs({ games, active, onChange }) {
  return (
    <nav className="filter-bar" role="tablist" aria-label="Filter games">
      {FILTERS.map((f) => {
        const count = games.filter(f.match).length;
        const isActive = f.id === active;
        return (
          <button
            key={f.id}
            role="tab"
            aria-selected={isActive}
            className={'filter-tab' + (isActive ? ' is-active' : '')}
            onClick={() => onChange(f.id)}>
            {f.label}
            <span className="filter-count">{count}</span>
          </button>
        );
      })}
    </nav>
  );
}
