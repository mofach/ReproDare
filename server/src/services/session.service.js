// src/services/session.service.js
import prisma from '../prisma/index.js';
import { toBigInt } from '../utils/helper.js';

/**
 * Session service
 * - createSession
 * - getSessionById
 * - listSessions
 * - getSessionTurns
 * - getUserTurns
 *
 * NOTE: do not implement socket logic here. Socket will use DB-level functions
 * (e.g., creating SessionTurn) directly when needed. This service keeps REST
 * operations tidy for controllers.
 */

export async function createSession({ teacherId, categoryId, title }) {
  if (!teacherId) throw new Error('teacherId required');
  if (!categoryId) throw new Error('categoryId required');

  // Pastikan category ada — lebih ramah daripada mengandalkan FK error
  // categoryId bisa berupa string/number, jadikan BigInt untuk lookup
  const cat = await prisma.category.findUnique({
    where: { id: toBigInt(categoryId) },
    select: { id: true, name: true },
  });
  if (!cat) {
    // berikan pesan yang jelas untuk client
    throw new Error(`Category with id=${categoryId} not found`);
  }

  const s = await prisma.session.create({
    data: {
      teacherId: toBigInt(teacherId),
      categoryId: toBigInt(categoryId),
      title: title ?? null,
      status: 'waiting',
    },
  });
  return s;
}

export async function getSessionById(id) {
  if (!id) throw new Error('session id required');
  const s = await prisma.session.findUnique({
    where: { id: toBigInt(id) },
    include: {
      category: true,
      teacher: { select: { id: true, name: true, email: true, role: true } },
    },
  });
  return s;
}

export async function listSessions({ status } = {}) {
  const where = {};
  if (status) where.status = status;
  return prisma.session.findMany({
    where,
    include: {
      category: true,
      teacher: { select: { id: true, name: true, email: true } },
    },
    orderBy: { id: 'desc' },
  });
}

export async function getSessionTurns(sessionId) {
  if (!sessionId) throw new Error('sessionId required');
  return prisma.sessionTurn.findMany({
    where: { sessionId: toBigInt(sessionId) },
    include: {
      card: true,
      participant: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { id: 'asc' },
  });
}

export async function getUserTurns(userId) {
  if (!userId) throw new Error('userId required');
  return prisma.sessionTurn.findMany({
    where: {
      participant: {
        userId: toBigInt(userId),
      },
    },
    include: {
      card: true,
      session: { include: { category: true, teacher: { select: { id: true, name: true } } } },
    },
    orderBy: { id: 'desc' },
  });
}

export default {
  createSession,
  getSessionById,
  listSessions,
  getSessionTurns,
  getUserTurns,
};
