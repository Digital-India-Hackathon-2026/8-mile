import Artisan from '../models/Artisan.js';
import path from 'path';

/**
 * POST /api/artisans/:id/images
 * Accepts multipart form images, stores filenames in artisan.photos[]
 * Category: 'workplace' | 'product' (from form field or defaults to 'product')
 */
export async function uploadArtisanImages(req, res, next) {
  try {
    const artisan = await Artisan.findById(req.params.id);
    if (!artisan) return res.status(404).json({ error: 'Artisan not found' });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    // Build URL paths for each uploaded file
    const newPhotos = req.files.map(f => `/uploads/${f.filename}`);
    artisan.photos.push(...newPhotos);
    await artisan.save();

    res.json({
      message: `${req.files.length} image(s) uploaded`,
      photos: artisan.photos,
      newPhotos,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/artisans/:id/images
 * Returns all photos for an artisan
 */
export async function getArtisanImages(req, res, next) {
  try {
    const artisan = await Artisan.findById(req.params.id).select('photos name craft');
    if (!artisan) return res.status(404).json({ error: 'Artisan not found' });
    res.json({ photos: artisan.photos, artisanName: artisan.name, craft: artisan.craft });
  } catch (err) {
    next(err);
  }
}
