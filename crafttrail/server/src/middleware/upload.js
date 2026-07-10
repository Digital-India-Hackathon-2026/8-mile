import multer from 'multer';

/** In-memory only. We OCR the buffer and never persist the credential document. */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /image\/(png|jpe?g|webp|tiff)|application\/pdf|text\/plain/.test(file.mimetype);
    cb(ok ? null : new Error('Upload a PNG/JPG/WEBP/TIFF/PDF document'), ok);
  },
});
