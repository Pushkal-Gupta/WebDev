export default function AchievementToast({ toast }) {
  if (!toast) return null;
  return (
    <div className="ach-toast" role="status" aria-live="polite">
      <div className="ach-toast-kicker">Achievement unlocked</div>
      <div className="ach-toast-title">{toast.label}</div>
      <div className="ach-toast-desc">{toast.desc}</div>
    </div>
  );
}
