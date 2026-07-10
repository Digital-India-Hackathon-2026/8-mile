import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { shortDate } from '../lib/format.js';
import './Certificate.css';

/**
 * The one screen that inverts. Everything else in CraftTrail is the indigo vat;
 * the certificate is the undyed cloth pulled out of it. A tourist is going to
 * screenshot this, so it has to read as a physical artifact, not a UI card.
 *
 * The tamper check is live: we call /verify and show what came back. We do not
 * claim a blockchain. We claim an HMAC signature, which is what we actually did.
 */
export default function Certificate() {
  const { code } = useParams();
  const [cert, setCert] = useState(null);
  const [check, setCheck] = useState(null);
  const [err, setErr] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.certificate(code).then(setCert).catch((e) => setErr(e.message));
    api.verifyCertificate(code).then(setCheck).catch(() => {});
  }, [code]);

  const share = async () => {
    const url = window.location.href;
    const text = `I learned ${cert.snapshot.craft} from ${cert.snapshot.artisanName} in ${cert.snapshot.district}. Verified artisan.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'CraftTrail', text, url });
        return;
      } catch {
        /* user dismissed the sheet; fall through to copy */
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  if (err) {
    return (
      <div className="cert-page">
        <div className="paper paper--empty">
          <h2>No certificate with that code</h2>
          <p>Check the code, or ask the artisan to reissue it from the completed booking.</p>
          <Link to="/" className="btn">Back to the map</Link>
        </div>
      </div>
    );
  }

  if (!cert) return <div className="cert-page"><span className="spinner" /></div>;

  const s = cert.snapshot;

  return (
    <div className="cert-page">
      <article className="paper">
        <header className="paper__head">
          <div>
            <p className="paper__brand">CraftTrail</p>
            <p className="paper__kind">Certificate of Authenticity</p>
          </div>
          <p className="paper__code">{cert.code}</p>
        </header>

        <div className="paper__body">
          <p className="paper__lede">
            <span>{cert.touristName}</span> visited the workshop of
          </p>

          <h1 className="paper__artisan">{s.artisanName}</h1>
          <p className="paper__craft">{s.craft}</p>

          <dl className="paper__facts">
            <div>
              <dt>Geographical Indication</dt>
              <dd>{s.giTag || '—'}</dd>
            </div>
            <div>
              <dt>Cluster</dt>
              <dd>{s.clusterName || '—'}</dd>
            </div>
            <div>
              <dt>District</dt>
              <dd>{s.district}, {s.state}</dd>
            </div>
            <div>
              <dt>Verification at issue</dt>
              <dd>{s.badge} · {s.trustScoreAtIssue}/100</dd>
            </div>
          </dl>

          {s.heritageNote && <p className="paper__heritage">{s.heritageNote}</p>}
        </div>

        <footer className="paper__foot">
          <div className="seal">
            <span className={`seal__ring ${check?.valid ? 'is-valid' : 'is-unknown'}`}>
              {check ? (check.valid ? '✓' : '✕') : '…'}
            </span>
            <div>
              <p className="seal__title">
                {check ? (check.valid ? 'Signature verified' : 'Signature does not match') : 'Checking signature…'}
              </p>
              <p className="seal__sub">
                HMAC-SHA256 · issued {shortDate(cert.issuedAt)}
              </p>
            </div>
          </div>
          <p className="paper__sig">{cert.signature.slice(0, 32)}…</p>
        </footer>
      </article>

      <div className="cert-actions">
        <button className="btn btn-primary" onClick={share}>
          {copied ? 'Link copied' : 'Share this'}
        </button>
        <Link className="btn" to={`/artisan/${cert.artisan}`}>
          Visit {s.artisanName} yourself
        </Link>
      </div>

      <p className="cert-fine">
        Anyone can re-check this at <code>/api/certificates/{cert.code}/verify</code>. It is not a
        blockchain — it is a signature over a fixed payload, which is the property you actually
        want: issued by CraftTrail, unaltered since.
      </p>
    </div>
  );
}
