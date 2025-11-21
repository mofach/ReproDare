// src/services/category.service.js
import prisma from '../prisma/index.js';

export async function createCategory({ name, description, createdBy }) {
  if (!name) throw new Error('Category name is required');
  const category = await prisma.category.create({
    data: {
      name,
      description: description ?? null,
      created_by: createdBy ? BigInt(createdBy) : null
    }
  });
  return category;
}

export async function updateCategory(id, { name, description }) {
  if (!id) throw new Error('Category id is required');
  const updated = await prisma.category.update({
    where: { id: BigInt(id) },
    data: {
      name: name ?? undefined,
      description: description ?? undefined
    }
  });
  return updated;
}

export async function deleteCategory(id) {
  if (!id) throw new Error('Category id is required');
  await prisma.category.delete({ where: { id: BigInt(id) } });
  return;
}

export async function getCategoryById(id) {
  return prisma.category.findUnique({
    where: { id: BigInt(id) }
  });
}

export async function listCategories({ q, limit = 50, offset = 0 } = {}) {
  const where = q ? { name: { contains: q, mode: 'insensitive' } } : {};
  const items = await prisma.category.findMany({
    where,
    take: Number(limit),
    skip: Number(offset),
    orderBy: { createdAt: 'desc' }
  });
  return items;
}