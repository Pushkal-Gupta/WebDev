// Skeleton — generic shimmer primitive used across pages while data loads.
//
// Three shapes cover everything we have today:
//   • rect   — cards, cover art, panels                (default)
//   • text   — single line of text (title, score, etc.)
//   • circle — avatars, badges, dots
//
// The animation is two-pass:
//   1) the block itself pulses opacity 0.4 → 0.7 → 0.4 (1.4s, linear, infinite)
//   2) a ::after element sweeps a subtle gradient L→R for the tactile shimmer
//
// Both animations are neutralized by the global prefers-reduced-motion rule
// in styles.css, so we don't duplicate that logic here.

export default function Skeleton({
  className = '',
  style,
  variant = 'rect',
  aspectRatio,
}) {
  const variantClass =
    variant === 'circle' ? 'skel-circle'
    : variant === 'text' ? 'skel-text'
    : 'skel-rect';

  const composed = {
    ...(aspectRatio ? { aspectRatio } : null),
    ...style,
  };

  return (
    <span
      className={`skel ${variantClass} ${className}`.trim()}
      style={composed}
      aria-hidden="true"
    />
  );
}
