import { TIERS } from '../lib/constants.js';
import './TrustLadder.css';

/**
 * The signature element.
 *
 * A judge's first probe is always "so what stops someone forging a badge?"
 * A number on a progress bar cannot answer that. This can: it shows the three
 * tiers as physically stacked bands with their own hard ceilings, so you can
 * SEE that a document alone tops out at 40 and one bribed verifier tops out
 * at 60. The ceiling lines are the point; the fill is secondary.
 */
export default function TrustLadder({ artisan, compact = false }) {
  const v = artisan?.verification || {};

  const earned = {
    tier1: (v.tier1?.formatValid ? 20 : 0) + (v.tier1?.giDistrictMatch ? 20 : 0),
    tier2: (() => {
      const n = v.tier2?.endorsements?.length || 0;
      return (n >= 1 ? 20 : 0) + (n >= 2 ? 15 : 0);
    })(),
    tier3: (() => {
      const { reviewCount = 0, avgRating = 0 } = v.tier3 || {};
      if (!reviewCount) return 0;
      return Math.round(25 * (avgRating / 5) * Math.min(reviewCount / 10, 1));
    })(),
  };

  // The headline is the SERVER's score, never a client recomputation. If the two
  // ever disagree, the server is right and the bug is visible rather than hidden.
  const total = artisan?.trustScore ?? 0;
  const failed = v.tier1?.status !== 'PASS';

  return (
    <div className={`ladder ${compact ? 'ladder--compact' : ''}`}>
      <div className="ladder__head">
        <span className="eyebrow">Trust score</span>
        <div className="ladder__total">
          <span className={`ladder__num ${failed ? 'is-failed' : ''}`}>{failed ? '—' : total}</span>
          <span className="ladder__den">/ 100</span>
        </div>
      </div>

      <div className="ladder__stack" role="img" aria-label={`Trust score ${total} of 100`}>
        {TIERS.map((tier, i) => {
          const got = earned[tier.key];
          const pct = (got / tier.max) * 100;

          return (
            <div className="rung" key={tier.key} style={{ flexGrow: tier.max }}>
              <div className="rung__bar">
                <div
                  className={`rung__fill rung__fill--${tier.key}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="rung__meta">
                <div className="rung__title">
                  <span className="rung__name">{tier.name}</span>
                  <span className="mono rung__score">
                    {got}<span className="rung__max">/{tier.max}</span>
                  </span>
                </div>
                {!compact && <p className="rung__detail">{tier.detail}</p>}
              </div>

              {i < TIERS.length - 1 && (
                <div className="rung__ceiling">
                  <span className="rung__ceiling-line" />
                  <span className="mono rung__ceiling-label">
                    {tier.ceilingAt} — {tier.ceiling}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {failed && (
        <p className="ladder__failed">
          Tier 1 did not pass, so no score is shown. {v.tier1?.reason}
        </p>
      )}
    </div>
  );
}
