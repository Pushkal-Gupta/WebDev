// In-game keybinding cheat-sheet. Toggled with `?`.

const ROWS = [
  { keys: ['1', '2', '3'], action: 'Spawn unit (left/middle/right card)' },
  { keys: ['Q', 'W', 'E'], action: 'Build / upgrade turret slot 1 / 2 / 3' },
  { keys: ['Space'],       action: 'Fire special' },
  { keys: ['R'],           action: 'Evolve to next era' },
  { keys: ['P'],           action: 'Pause / resume' },
  { keys: ['Esc'],         action: 'Close settings drawer' },
  { keys: ['?'],           action: 'Toggle this card' },
];

export default function ShortcutsOverlay({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="es-shortcuts" role="dialog" aria-label="Keyboard shortcuts" onClick={onClose}>
      <div className="es-shortcuts-card" onClick={(e) => e.stopPropagation()}>
        <header className="es-shortcuts-head">
          <h3>Shortcuts</h3>
        </header>
        <ul className="es-shortcuts-list">
          {ROWS.map((row, i) => (
            <li key={i} className="es-shortcuts-row">
              <span className="es-shortcuts-keys">
                {row.keys.map((k, j) => (
                  <kbd key={j}>{k}</kbd>
                ))}
              </span>
              <span className="es-shortcuts-action">{row.action}</span>
            </li>
          ))}
        </ul>
        <footer className="es-shortcuts-foot">
          Click anywhere or press <kbd>?</kbd> to close
        </footer>
      </div>
    </div>
  );
}
