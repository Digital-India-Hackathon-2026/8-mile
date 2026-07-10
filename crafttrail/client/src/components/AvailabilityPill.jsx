import { AVAILABILITY } from '../lib/constants.js';
import './AvailabilityPill.css';

export default function AvailabilityPill({ state, source }) {
  const a = AVAILABILITY[state] || AVAILABILITY.REQUEST_AND_CONFIRM;
  return (
    <span className={`avail avail--${a.tone}`} title={source ? `Set via ${source}` : undefined}>
      <span className="avail__dot" />
      {a.label}
    </span>
  );
}
