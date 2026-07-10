import './Badge.css';

const LEVELS = {
  0: { cls: 'is-none', mark: '·' },
  1: { cls: 'is-doc', mark: '1' },
  2: { cls: 'is-inst', mark: '2' },
  3: { cls: 'is-comm', mark: '3' },
};

/** Derived from trustScore + tier1 status server-side. Never stored, never drifts. */
export default function Badge({ badge }) {
  if (!badge) return null;
  const l = LEVELS[badge.level] || LEVELS[0];
  return (
    <span className={`badge ${l.cls}`}>
      <span className="badge__mark mono">{l.mark}</span>
      {badge.label}
    </span>
  );
}
