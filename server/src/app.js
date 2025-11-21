// src/app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/category.routes.js';
import cardRoutes from './routes/card.routes.js';

export default function createApp() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());

  app.get('/', (req, res) => res.json({ ok: true }));

  app.use('/auth', authRoutes);
  app.use('/categories', categoryRoutes);
  app.use('/cards', cardRoutes);

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'internal error' });
  });

  return app;
}
