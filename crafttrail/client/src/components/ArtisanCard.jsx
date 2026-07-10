import { Link } from 'react-router-dom';
import Badge from './Badge.jsx';
import AvailabilityPill from './AvailabilityPill.jsx';
import { inr, km } from '../lib/format.js';
import './ArtisanCard.css';

export default function ArtisanCard({ artisan, cluster, active, onHover }) {
  const failed = artisan.badge?.level === 0;

  return (
    <Link
      to={`/artisan/${artisan.id}`}
      className={`ac ${active ? 'is-active' : ''} ${failed ? 'is-failed' : ''}`}
      onMouseEnter={() => onHover?.(artisan.id)}
    >
      <div className="ac__main">
        <div className="ac__row">
          <h3 className="ac__name">{artisan.name}</h3>
          {/* A badge on an invented person is worse than no badge. Say so. */}
          {artisan.isDemo && <span className="ac__demo mono">Demo profile</span>}
        </div>
        <p className="ac__craft">{artisan.craft}</p>
        <p className="ac__where mono">
          {cluster
            ? `${cluster.name} · ${km(cluster.distanceKm)}`
            : `${artisan.district || ''}${artisan.district && artisan.state ? ', ' : ''}${artisan.state || ''}`}
        </p>
        <div className="ac__meta">
          <AvailabilityPill state={artisan.availability} />
        </div>
      </div>

      <div className="ac__side">
        <Badge badge={artisan.badge} />
        {artisan.priceInr > 0 && <span className="ac__price">{inr(artisan.priceInr)}</span>}
        {!failed && <span className="ac__trust mono">{artisan.trustScore}/100</span>}
      </div>
    </Link>
  );
}
