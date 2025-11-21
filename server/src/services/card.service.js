// src/services/card.service.js
import prisma from '../prisma/index.js';

export async function createCard({ categoryId, type, content, createdBy }) {
  if (!categoryId) throw new Error('categoryId is required');
  if (!type) throw new Error('type is required');
  if (!content) throw new Error('content is required');

  // validate type
  if (!['truth', 'dare'].includes(type)) throw new Error('type must be truth or dare');

  const card = await prisma.card.create({
    data: {
      categoryId: BigInt(categoryId),
      type,
      content,
      created_by: createdBy ? BigInt(createdBy) : null
    }
  });
  return card;
}

export async function updateCard(id, { type, content, categoryId }) {
  if (!id) throw new Error('card id required');
  const data = {};
  if (type) {
    if (!['truth', 'dare'].includes(type)) throw new Error('type must be truth or dare');
    data.type = type;
  }
  if (content !== undefined) data.content = content;
  if (categoryId !== undefined) data.categoryId = BigInt(categoryId);
  const updated = await prisma.card.update({
    where: { id: BigInt(id) },
    data
  });
  return updated;
}

export async function deleteCard(id) {
  if (!id) throw new Error('card id required');
  await prisma.card.delete({ where: { id: BigInt(id) } });
  return;
}

export async function getCardById(id) {
  return prisma.card.findUnique({ where: { id: BigInt(id) } });
}

export async function listCards({ categoryId, type, q, limit = 100, offset = 0 } = {}) {
  const where = {};
  if (categoryId) where.categoryId = BigInt(categoryId);
  if (type) where.type = type;
  if (q) {
    where.content = { contains: q, mode: 'insensitive' };
  }
  const items = await prisma.card.findMany({
    where,
    take: Number(limit),
    skip: Number(offset),
    orderBy: { createdAt: 'desc' }
  });
  return items;
}

// helper: pick random card by category
export async function pickRandomCardForCategory(categoryId) {
  const count = await prisma.card.count({ where: { categoryId: BigInt(categoryId) } });
  if (count === 0) return null;
  const skip = Math.floor(Math.random() * count);
  const [card] = await prisma.card.findMany({
    where: { categoryId: BigInt(categoryId) },
    take: 1,
    skip
  });
  return card || null;
}
