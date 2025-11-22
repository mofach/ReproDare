// src/services/auth.service.js
import prisma from '../prisma/index.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { signAccessToken, createRefreshToken, verifyRefreshToken, revokeRefreshToken } from '../utils/jwt.js';

/**
 * Lightweight serializer for user objects (no dependency on serializer.js)
 * Removes sensitive fields and normalizes ID & timestamps.
 */
function serializeUser(user) {
  if (!user) return user;
  // Convert Prisma BigInt id to string if necessary
  const id = user.id !== undefined ? String(user.id) : undefined;

  // Normalize created/updated fields if present (could be camelCase or snake_case)
  const createdAt = user.createdAt ?? user.created_at ?? user.created_at;
  const updatedAt = user.updatedAt ?? user.updated_at ?? user.updatedAt;

  return {
    id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: createdAt ? (createdAt instanceof Date ? createdAt.toISOString() : String(createdAt)) : undefined,
    updatedAt: updatedAt ? (updatedAt instanceof Date ? updatedAt.toISOString() : String(updatedAt)) : undefined,
  };
}

/**
 * registerStudent: self-register student
 */
export async function registerStudent({ name, email, password }) {
  if (!name || !email || !password) throw new Error('Missing fields');
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('Email already in use');

  const password_hash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, password_hash, role: 'student' }
  });

  return serializeUser(user);
}

/**
 * createTeacher: only Admin should call (we won't enforce here in route)
 */
export async function createTeacher({ name, email, password }) {
  if (!name || !email || !password) throw new Error('Missing fields');
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('Email already in use');

  const password_hash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, password_hash, role: 'teacher' }
  });
  return serializeUser(user);
}

/**
 * loginUser: verify credentials and return tokens
 */
export async function loginUser({ email, password }) {
  if (!email || !password) throw new Error('Missing fields');
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');

  const ok = await comparePassword(password, user.password_hash);
  if (!ok) throw new Error('Invalid credentials');

  // signAccessToken expects id as string (we keep that)
  const accessToken = signAccessToken({ id: String(user.id), role: user.role, name: user.name, email: user.email });
  const refreshToken = await createRefreshToken(user.id);

  return { accessToken, refreshToken, user: serializeUser(user) };
}

/**
 * refreshAuth: given refresh token, return new tokens (rotate)
 */
export async function refreshAuth(refreshToken) {
  const verified = await verifyRefreshToken(refreshToken);
  if (!verified) throw new Error('Invalid or expired refresh token');
  const { user } = verified;
  // rotate: revoke old -> create new
  await revokeRefreshToken(refreshToken);
  const newRefresh = await createRefreshToken(user.id);
  const accessToken = signAccessToken({ id: String(user.id), role: user.role, name: user.name, email: user.email });
  return { accessToken, refreshToken: newRefresh, user: serializeUser(user) };
}

/**
 * logout: revoke refresh token
 */
export async function logout(refreshToken) {
  await revokeRefreshToken(refreshToken);
  return;
}
