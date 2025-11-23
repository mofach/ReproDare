// src/app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/category.routes.js';
import cardRoutes from './routes/card.routes.js';
import sessionRoutes from './routes/session.routes.js';
import userRoutes from './routes/user.routes.js'; // <--- Import Baru

// Keep the BigInt global patch
BigInt.prototype.toJSON = function () { return Number(this); };

export default function createApp() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());

  app.get('/', (req, res) => res.json({ ok: true }));

  app.use('/auth', authRoutes);
  app.use('/categories', categoryRoutes);
  app.use('/cards', cardRoutes);
  app.use('/sessions', sessionRoutes);
  app.use('/users', userRoutes); // <--- Register Route Baru

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err?.status || 500).json({ error: err?.message || 'internal error' });
  });

  return app;
}