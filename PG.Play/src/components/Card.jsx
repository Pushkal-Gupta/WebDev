// Card — bento-aware game tile.
//
// Two variants:
//   - "hero"     : large immersive tile, full-bleed cover, overlay title,
//                  glass "Play" pill on hover, used for the four originals.
//   - "standard" : compact tile (cover + body), used for the two classics.
//
// Genre accent colour comes from `game.cat`; we expose it as a CSS var
// (`--genre-accent`) on the element so children can pick it up without
// JS hex strings. Cards animate in via framer-motion stagger; hero cards
// also receive a 3D tilt driven by mouse position.

import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { GAME_COVERS } from '../covers.jsx';
import { Icon } from '../icons.jsx';

const CAT_TO_GENRE = {
  Action:    'action',
  Rage:      'action',
  Arcade:    'arcade',
  Sports:    'sports',
  Puzzle:    'puzzle',
  Classic:   'puzzle',
  FPS:       'action',
  Shooter:   'action',
  Platformer:'action',
  'Time-mgmt':'arcade',
  'Tower-Def':'puzzle',
  Strategy:  'puzzle',
  Stealth:   'action',
  'Co-op':   'arcade',
  Multiplayer:'action',
  Physics:   'arcade',
};

function genreVar(cat) {
  const key = CAT_TO_GENRE[cat] || 'arcade';
  return `var(--genre-${key})`;
}

export default function Card({
  game,
  fav,
  onFav,
  onOpen,
  variant = 'standard',
  index = 0,
}) {
  const Cover = GAME_COVERS[game.id];
  const reduced = useReducedMotion();
  const accent = genreVar(game.cat);

  // 3D tilt motion values — only used on hero variant.
  const cardRef = useRef(null);
  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const rotX = useSpring(useTransform(mvY, [-0.5, 0.5], [6, -6]),  { stiffness: 220, damping: 20 });
  const rotY = useSpring(useTransform(mvX, [-0.5, 0.5], [-6, 6]), { stiffness: 220, damping: 20 });
  const glowX = useTransform(mvX, (v) => `${(v + 0.5) * 100}%`);
  const glowY = useTransform(mvY, (v) => `${(v + 0.5) * 100}%`);
  const glowOpacity = useMotionValue(0);
  const glowOpacitySpring = useSpring(glowOpacity, { stiffness: 200, damping: 20 });

  const onMove = (e) => {
    if (reduced || variant !== 'hero') return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mvX.set(((e.clientX - rect.left) / rect.width) - 0.5);
    mvY.set(((e.clientY - rect.top) / rect.height) - 0.5);
    glowOpacity.set(1);
  };
  const onLeave = () => {
    mvX.set(0);
    mvY.set(0);
    glowOpacity.set(0);
  };

  const baseTransition = { type: 'spring', stiffness: 320, damping: 22 };
  const initial = reduced ? { opacity: 0 } : { y: 16, opacity: 0 };
  const animate = reduced ? { opacity: 1 } : { y: 0, opacity: 1 };
  const transition = reduced
    ? { duration: 0.18 }
    : { duration: 0.32, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] };
  const whileHover = reduced ? undefined : { y: -4, scale: 1.02, transition: baseTransition };

  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen?.(); }
  };

  if (variant === 'hero') {
    return (
      <motion.div
        ref={cardRef}
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={onKey}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className={`bento-card bento-card-hero genre-${CAT_TO_GENRE[game.cat] || 'arcade'}`}
        style={{ '--genre-accent': accent, transformStyle: 'preserve-3d', rotateX: reduced ? 0 : rotX, rotateY: reduced ? 0 : rotY }}
        initial={initial}
        animate={animate}
        transition={transition}
        whileHover={whileHover}
        aria-label={`Play ${game.name}`}
      >
        <div className="bento-card-cover" aria-hidden="true">
          {Cover && <Cover/>}
        </div>
        <div className="bento-card-shade" aria-hidden="true"/>
        <motion.div
          className="bento-card-glow"
          aria-hidden="true"
          style={{
            opacity: glowOpacitySpring,
            ['--glow-x']: glowX,
            ['--glow-y']: glowY,
          }}
        />

        <div className="bento-card-chrome">
          <div className="bento-card-meta">
            {game.isOriginal && (
              <span className="bento-tag glass">
                {Icon.sparkle}
                <span>Original</span>
              </span>
            )}
            <span className="bento-tag bento-tag-genre glass">
              <span className="bento-tag-dot" style={{ background: accent }}/>
              <span>{game.cat}</span>
            </span>
          </div>
          <button
            className={'bento-fav glass' + (fav ? ' is-active' : '')}
            onClick={(e) => { e.stopPropagation(); onFav?.(game.id); }}
            aria-label={fav ? `Unfavorite ${game.name}` : `Favorite ${game.name}`}
            type="button"
          >
            {fav ? Icon.heartF : Icon.heart}
          </button>
        </div>

        <div className="bento-card-body">
          <h3 className="bento-card-title">{game.name}</h3>
          <p className="bento-card-tagline">{game.tagline}</p>
          <span className="bento-card-cta glass" aria-hidden="true">
            {Icon.play}
            <span>Play</span>
          </span>
        </div>
      </motion.div>
    );
  }

  // standard variant — compact tile for classics
  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={onKey}
      className={`bento-card bento-card-standard genre-${CAT_TO_GENRE[game.cat] || 'arcade'}`}
      style={{ '--genre-accent': accent }}
      initial={initial}
      animate={animate}
      transition={transition}
      whileHover={whileHover}
      aria-label={`Play ${game.name}`}
    >
      <div className="bento-card-cover" aria-hidden="true">
        {Cover && <Cover/>}
        <div className="bento-card-shade bento-card-shade-soft"/>
      </div>
      <button
        className={'bento-fav glass' + (fav ? ' is-active' : '')}
        onClick={(e) => { e.stopPropagation(); onFav?.(game.id); }}
        aria-label={fav ? `Unfavorite ${game.name}` : `Favorite ${game.name}`}
        type="button"
      >
        {fav ? Icon.heartF : Icon.heart}
      </button>
      <div className="bento-card-body bento-card-body-standard">
        <div className="bento-card-row">
          <span className="bento-tag-dot" style={{ background: accent }}/>
          <h3 className="bento-card-title bento-card-title-sm">{game.name}</h3>
        </div>
        <p className="bento-card-tagline bento-card-tagline-sm">{game.tagline}</p>
      </div>
    </motion.div>
  );
}
