import { PALETTES, SHAPES, CRT_OPTS } from '../data.js';
import { Icon } from '../icons.jsx';

export default function TweaksPanel({ tweaks, setTweaks, onClose }) {
  return (
    <div className="pd-tweaks">
      <div className="pd-tweaks-head">
        <span>Tweaks</span>
        <button
          onClick={onClose}
          style={{background:'none',border:'none',color:'var(--dim)',cursor:'pointer',padding:0}}
          aria-label="Close tweaks">
          <span style={{width:14,height:14,display:'inline-block'}}>{Icon.close}</span>
        </button>
      </div>
      <div className="pd-tweak-row">
        <div className="pd-tweak-label">Palette</div>
        <div className="pd-tweak-opts">
          {PALETTES.map(p => (
            <div key={p.name}
              className={'pd-tweak-swatch' + (tweaks.palette === p.name ? ' active' : '')}
              style={{background:`linear-gradient(135deg, ${p.accent}, ${p.a2})`}}
              onClick={() => setTweaks({...tweaks, palette: p.name})}
              title={p.name}/>
          ))}
        </div>
      </div>
      <div className="pd-tweak-row">
        <div className="pd-tweak-label">Card shape</div>
        <div className="pd-tweak-opts">
          {SHAPES.map(s => (
            <button key={s.id}
              className={'pd-tweak-opt' + (tweaks.shape === s.id ? ' active' : '')}
              onClick={() => setTweaks({...tweaks, shape: s.id})}>
              {s.name}
            </button>
          ))}
        </div>
      </div>
      <div className="pd-tweak-row">
        <div className="pd-tweak-label">CRT scanlines</div>
        <div className="pd-tweak-opts">
          {CRT_OPTS.map(o => (
            <button key={o.id}
              className={'pd-tweak-opt' + (tweaks.crt === o.id ? ' active' : '')}
              onClick={() => setTweaks({...tweaks, crt: o.id})}>
              {o.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
