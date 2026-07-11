import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth.js';

import { discover, artisanDetail, searchArtisans } from '../controllers/discoveryController.js';
import {
  createArtisan, verifyTier1, endorseTier2, auditTrail,
  listVerifiers, listClusters, listCrafts, listStates,
} from '../controllers/verificationController.js';
import {
  requestBooking, confirmBooking, completeBooking, getBooking,
  getCertificate, verifyCertificateRoute, leaveReview,
} from '../controllers/bookingController.js';
import { webhook, prompt, institutionProxy } from '../controllers/whatsappController.js';
import { register, login, me, updateMe, myBookings, changePassword, deleteAccount } from '../controllers/authController.js';
import * as admin from '../controllers/adminController.js';
import * as vault from '../controllers/vaultController.js';
import { uploadArtisanImages, getArtisanImages } from '../controllers/artisanImagesController.js';
import { saveArtisan, unsaveArtisan, markVisited, getSavedVisited } from '../controllers/savedController.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true, service: 'crafttrail', ts: Date.now() }));

// --- Auth --------------------------------------------------------------
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', requireAuth, me);
router.patch('/auth/me', requireAuth, updateMe);
router.post('/auth/me/password', requireAuth, changePassword);
router.delete('/auth/me', requireAuth, deleteAccount);
router.get('/auth/me/bookings', requireAuth, myBookings);

// --- Discovery: public. Signing in personalises it; it never gates it. ---
router.get('/discover',        optionalAuth, discover);
router.get('/discover/search', searchArtisans);
router.get('/discover/artisans/:id', artisanDetail);
router.get('/clusters', listClusters);
router.get('/crafts', listCrafts);
router.get('/states', listStates);

// --- Verification ------------------------------------------------------
router.post('/artisans', requireAuth, requireAdmin, createArtisan);
router.post('/artisans/:id/verify', requireAuth, requireAdmin, upload.single('document'), verifyTier1);
router.post('/artisans/:id/endorse', requireAuth, requireAdmin, endorseTier2);
router.get('/artisans/:id/audit', auditTrail);
router.get('/verifiers', listVerifiers);

// --- Admin console -----------------------------------------------------
router.get('/admin/stats', requireAuth, requireAdmin, admin.stats);
router.get('/admin/audit', requireAuth, requireAdmin, admin.fullAudit);
router.get('/admin/artisans', requireAuth, requireAdmin, admin.listArtisans);
router.post('/admin/artisans', requireAuth, requireAdmin, admin.createArtisan);
router.patch('/admin/artisans/:id', requireAuth, requireAdmin, admin.updateArtisan);
router.delete('/admin/artisans/:id', requireAuth, requireAdmin, admin.deleteArtisan);

// --- Booking. Reading is public; acting requires an account. ------------
router.get('/bookings/:id', getBooking);
router.post('/bookings', requireAuth, requestBooking);
router.post('/bookings/:id/confirm', confirmBooking);
router.post('/bookings/:id/complete', completeBooking);
router.post('/bookings/:id/review', requireAuth, leaveReview);

// --- WhatsApp ----------------------------------------------------------
router.post('/whatsapp/webhook', webhook);
router.post('/whatsapp/prompt/:artisanId', prompt);
router.post('/whatsapp/proxy/:artisanId', institutionProxy);

// --- Certificates: public forever. A shared link must open for anyone. --
router.get('/certificates/:code', getCertificate);
router.get('/certificates/:code/verify', verifyCertificateRoute);

// ═══════════════════════════════════════════════════════════════════
// VAULT — Hidden admin portal. Not linked anywhere in the public UI.
// Access: /api/vault/*   (frontend hidden route: /guildmaster)
// ═══════════════════════════════════════════════════════════════════
router.post('/vault/login',    vault.vaultLogin);

router.get ('/vault/stats',                              vault.requireVault, vault.vaultStats);
router.get ('/vault/artisans',                           vault.requireVault, vault.vaultListArtisans);
router.post('/vault/artisans',                           vault.requireVault, vault.vaultCreateArtisan);
router.get ('/vault/artisans/:id',                       vault.requireVault, vault.vaultGetArtisan);
router.patch('/vault/artisans/:id',                      vault.requireVault, vault.vaultUpdateArtisan);
router.delete('/vault/artisans/:id',                     vault.requireVault, vault.vaultDeleteArtisan);

router.post  ('/vault/artisans/:id/docs',                vault.requireVault, upload.single('file'), vault.vaultAddDoc);
router.delete('/vault/artisans/:id/docs/:docId',         vault.requireVault, vault.vaultDeleteDoc);

router.post  ('/vault/artisans/:id/certificates',        vault.requireVault, upload.single('file'), vault.vaultAddCertificate);
router.delete('/vault/artisans/:id/certificates/:certId',vault.requireVault, vault.vaultDeleteCertificate);

router.post  ('/vault/artisans/:id/awards',              vault.requireVault, upload.single('image'), vault.vaultAddAward);
router.delete('/vault/artisans/:id/awards/:awardId',     vault.requireVault, vault.vaultDeleteAward);

router.post  ('/vault/artisans/:id/products',            vault.requireVault, upload.single('image'), vault.vaultAddProduct);
router.delete('/vault/artisans/:id/products/:productId', vault.requireVault, vault.vaultDeleteProduct);

// --- Artisan image uploads (workplace & product photos) ----------------
router.post('/artisans/:id/images', upload.array('images', 10), uploadArtisanImages);
router.get('/artisans/:id/images', getArtisanImages);

// --- Saved & visited artisans (for map overlay) -------------------------
router.get('/me/saved', requireAuth, getSavedVisited);
router.post('/me/saved/:artisanId', requireAuth, saveArtisan);
router.delete('/me/saved/:artisanId', requireAuth, unsaveArtisan);
router.post('/me/visited/:artisanId', requireAuth, markVisited);

export default router;