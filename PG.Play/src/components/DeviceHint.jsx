import { Icon } from '../icons.jsx';

export default function DeviceHint({ game, onContinue, onExit }) {
  return (
    <div className="device-hint">
      <div className="device-hint-icon">{Icon.monitor}</div>
      <div className="device-hint-kicker">Best on desktop</div>
      <h3 className="device-hint-title">{game.name} is a keyboard-and-mouse game</h3>
      <p className="device-hint-body">
        This title was designed around precise keyboard control. It runs on a phone,
        but you’ll get a much better first session on a laptop or desktop — just open
        PG.Play on a bigger screen when you have one.
      </p>
      <div className="device-hint-actions">
        <button className="btn btn-primary" onClick={onContinue}>Play anyway</button>
        <button className="btn btn-ghost" onClick={onExit}>Back to lobby</button>
      </div>
    </div>
  );
}
