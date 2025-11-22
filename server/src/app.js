// src/app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/category.routes.js';
import cardRoutes from './routes/card.routes.js';
import sessionRoutes from './routes/session.routes.js';

// Keep the BigInt global patch exactly as you used it so nothing breaks.
// It converts BigInt to Number when JSON.stringify is called.
BigInt.prototype.toJSON = function () { return Number(this); };

export default function createApp() {
  const app = express();

  // Use CORS permissive for dev; if you have env var later we can switch to that.
  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());

  app.get('/', (req, res) => res.json({ ok: true }));

  app.use('/auth', authRoutes);
  app.use('/categories', categoryRoutes);
  app.use('/cards', cardRoutes);
  app.use('/sessions', sessionRoutes);

  // Inline error handler — keep this simple handler (no external file).
  // This preserves current behavior and won't require adding new files.
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err?.status || 500).json({ error: err?.message || 'internal error' });
  });

  return app;
}
