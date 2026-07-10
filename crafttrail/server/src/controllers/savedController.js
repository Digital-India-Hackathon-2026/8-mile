import User from '../models/User.js';
import Artisan from '../models/Artisan.js';

/** GET /api/me/saved — return saved + visited artisans with coordinates */
export async function getSavedVisited(req, res, next) {
  try {
    const user = await User.findById(req.user._id)
      .populate('savedArtisans',   'name craft district state location photos trustScore')
      .populate('visitedArtisans', 'name craft district state location photos trustScore');

    res.json({
      saved:   user.savedArtisans   || [],
      visited: user.visitedArtisans || [],
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/me/saved/:artisanId — bookmark an artisan */
export async function saveArtisan(req, res, next) {
  try {
    const { artisanId } = req.params;
    const artisan = await Artisan.findById(artisanId);
    if (!artisan) return res.status(404).json({ error: 'Artisan not found' });

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { savedArtisans: artisanId },
    });
    res.json({ message: 'Saved', artisanId });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/me/saved/:artisanId — remove bookmark */
export async function unsaveArtisan(req, res, next) {
  try {
    const { artisanId } = req.params;
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { savedArtisans: artisanId },
    });
    res.json({ message: 'Removed', artisanId });
  } catch (err) {
    next(err);
  }
}

/** POST /api/me/visited/:artisanId — mark artisan as visited */
export async function markVisited(req, res, next) {
  try {
    const { artisanId } = req.params;
    const artisan = await Artisan.findById(artisanId);
    if (!artisan) return res.status(404).json({ error: 'Artisan not found' });

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { visitedArtisans: artisanId },
    });
    res.json({ message: 'Marked as visited', artisanId });
  } catch (err) {
    next(err);
  }
}
