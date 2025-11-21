// src/services/auth.service.js
import prisma from '../prisma/index.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { signAccessToken, createRefreshToken, verifyRefreshToken, revokeRefreshToken } from '../utils/jwt.js';
import { sanitizeUser } from '../utils/serializer.js';

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

  return sanitizeUser(user);
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
  return sanitizeUser(user);
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

  const accessToken = signAccessToken({ id: user.id.toString(), role: user.role, name: user.name, email: user.email });
  const refreshToken = await createRefreshToken(user.id);

  return { accessToken, refreshToken, user: sanitizeUser(user) };
}

/**
 * refreshAuth: given refresh token, return new tokens (rotate)
 */
export async function refreshAuth(refreshToken) {
  const verified = await verifyRefreshToken(refreshToken);
  if (!verified) throw new Error('Invalid or expired refresh token');
  const { user } = verified;
  // rotate
  await revokeRefreshToken(refreshToken); // remove old
  const newRefresh = await createRefreshToken(user.id);
  const accessToken = signAccessToken({ id: user.id.toString(), role: user.role, name: user.name, email: user.email });
  return { accessToken, refreshToken: newRefresh, user: sanitizeUser(user) };
}

/**
 * logout: revoke refresh token
 */
export async function logout(refreshToken) {
  await revokeRefreshToken(refreshToken);
  return;
}
