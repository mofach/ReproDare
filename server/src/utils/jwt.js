// src/utils/jwt.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import prisma from '../prisma/index.js';
import crypto from 'crypto';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7', 10);

// Sign access token. Ensure id is string (avoid BigInt in payload).
export function signAccessToken(payload) {
  const safe = { ...payload };
  if (safe.id !== undefined) safe.id = String(safe.id);
  return jwt.sign(safe, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
}

export function verifyToken(token) {
  try {
    const p = jwt.verify(token, JWT_SECRET);
    // ensure id is string if present
    if (p && p.id !== undefined) p.id = String(p.id);
    return p;
  } catch (e) {
    return null;
  }
}

// refresh token helpers: create (store hashed) and verify
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createRefreshToken(userId) {
  const token = crypto.randomBytes(48).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId: BigInt(userId),
      token_hash: tokenHash,
      expires_at: expiresAt,
    },
  });

  return token;
}

export async function verifyRefreshToken(token) {
  const tokenHash = hashToken(token);
  const rt = await prisma.refreshToken.findFirst({
    where: { token_hash: tokenHash },
    include: { user: true },
  });
  if (!rt) return null;
  if (new Date(rt.expires_at) < new Date()) {
    await prisma.refreshToken.delete({ where: { id: rt.id } }).catch(()=>{});
    return null;
  }
  return { tokenDoc: rt, user: rt.user };
}

export async function revokeRefreshToken(token) {
  const tokenHash = hashToken(token);
  await prisma.refreshToken.deleteMany({ where: { token_hash: tokenHash } });
}

export async function rotateRefreshToken(userId, oldToken) {
  const oldHash = hashToken(oldToken);
  await prisma.refreshToken.deleteMany({ where: { userId: BigInt(userId), token_hash: oldHash } });
  return createRefreshToken(userId);
}
