import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { connectDB } from './config/db.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Rate limiting — keep it only for production so local development doesn't self-throttle.
if (isProduction) {
  app.use('/api/artisans/:id/verify', rateLimit({ windowMs: 60_000, max: 100 }));
  app.use('/api/auth', rateLimit({ windowMs: 60_000, max: 100 }));
  app.use('/api', rateLimit({ windowMs: 60_000, max: 500 }));
}

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crafttrail')
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[server] CraftTrail API on :${PORT}  (OCR_MODE=${process.env.OCR_MODE || 'ocr'})`);
    });
  })
  .catch((err) => {
    console.error('[server] failed to start:', err.message);
    process.exit(1);
  });

export default app;