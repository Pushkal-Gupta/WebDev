// LoadingBar — top-of-page indeterminate progress.
//
// 2px thin bar pinned to the very top of the viewport. Renders only when
// `active` is true so the DOM is clean during idle. The slide animation
// is driven entirely from CSS (.loadingbar / .loadingbar-fill keyframes
// in styles.css) and is killed by prefers-reduced-motion in the global
// CSS rule, so we don't gate it with useReducedMotion here.

export default function LoadingBar({ active = false }) {
  if (!active) return null;
  return (
    <div className="loadingbar" role="progressbar" aria-busy="true" aria-label="Loading">
      <div className="loadingbar-fill" />
    </div>
  );
}
