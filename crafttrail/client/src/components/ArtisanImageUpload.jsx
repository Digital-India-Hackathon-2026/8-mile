import { useRef, useState } from 'react';
import { api } from '../lib/api.js';
import './ArtisanImageUpload.css';

const SERVER = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';

export default function ArtisanImageUpload({ artisanId, existingPhotos = [] }) {
  const [photos,    setPhotos]    = useState(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const [preview,   setPreview]   = useState(null); // lightbox
  const [dragOver,  setDragOver]  = useState(false);
  const [msg,       setMsg]       = useState(null);
  const inputRef = useRef(null);

  const flash = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const valid = [...files].filter(f => validTypes.includes(f.type));
    if (valid.length === 0) return flash('Only JPG, PNG, WebP or GIF images are allowed.', false);

    setUploading(true);
    try {
      const form = new FormData();
      valid.forEach(f => form.append('images', f));

      const res = await fetch(`${SERVER}/api/artisans/${artisanId}/images`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setPhotos(data.photos);
      flash(`${valid.length} photo${valid.length > 1 ? 's' : ''} uploaded!`);
    } catch (e) {
      flash(e.message, false);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="aiu">
      <div className="aiu__header">
        <span className="eyebrow">Workplace &amp; Product Photos</span>
        <span className="aiu__count">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Upload Drop Zone */}
      <div
        className={`aiu__dropzone ${dragOver ? 'is-over' : ''} ${uploading ? 'is-busy' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload artisan photos"
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="aiu__spinner-wrap">
            <span className="aiu__spinner" />
            <span>Uploading…</span>
          </div>
        ) : (
          <>
            <div className="aiu__dz-icon">📷</div>
            <p className="aiu__dz-title">
              {dragOver ? 'Drop to upload' : 'Click or drag photos here'}
            </p>
            <p className="aiu__dz-sub">
              Showcase your workplace, tools &amp; products<br />
              JPG · PNG · WebP · up to 10 at once
            </p>
          </>
        )}
      </div>

      {/* Feedback message */}
      {msg && (
        <div className={`aiu__msg ${msg.ok ? 'aiu__msg--ok' : 'aiu__msg--err'}`}>
          {msg.text}
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="aiu__grid">
          {photos.map((p, i) => (
            <button
              key={i}
              className="aiu__thumb"
              onClick={() => setPreview(p)}
              aria-label={`View photo ${i + 1}`}
            >
              <img
                src={p.startsWith('http') ? p : `${SERVER}${p}`}
                alt={`Artisan photo ${i + 1}`}
                loading="lazy"
              />
              <span className="aiu__thumb-overlay">🔍</span>
            </button>
          ))}

          {/* "Add more" tile */}
          <button
            className="aiu__thumb aiu__thumb--add"
            onClick={() => inputRef.current?.click()}
            aria-label="Add more photos"
          >
            <span>+</span>
            <span className="aiu__add-label">Add more</span>
          </button>
        </div>
      )}

      {/* Lightbox */}
      {preview && (
        <div className="aiu__lightbox" onClick={() => setPreview(null)}>
          <div className="aiu__lb-box" onClick={e => e.stopPropagation()}>
            <button className="aiu__lb-close" onClick={() => setPreview(null)}>×</button>
            <img
              src={preview.startsWith('http') ? preview : `${SERVER}${preview}`}
              alt="Artisan photo"
            />
          </div>
        </div>
      )}
    </div>
  );
}
