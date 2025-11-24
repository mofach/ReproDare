// src/services/user.service.js
import prisma from '../prisma/index.js';

// Serializer lokal: Mengubah format DB (snake_case) ke format API (camelCase)
function serializeUser(user) {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    // Perbaikan: Mapping dari field DB (created_at) ke field JSON (createdAt)
    createdAt: user.created_at, 
    updatedAt: user.updated_at,
  };
}

export async function getUsers(roleFilter) {
  const where = {};
  
  if (roleFilter) {
    where.role = roleFilter;
  }

  const users = await prisma.user.findMany({
    where,
    // Perbaikan: Menggunakan 'created_at' sesuai schema.prisma model User
    orderBy: { created_at: 'desc' }, 
  });

  return users.map(serializeUser);
}

export async function deleteUserById(id) {
  if (!id) throw new Error("ID is required");

  let userId;
  try {
    userId = BigInt(id);
  } catch (e) {
    throw new Error("Invalid ID format");
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!existing) {
    throw new Error("User not found");
  }

  await prisma.user.delete({
    where: { id: userId }
  });

  return true;
}

// ...
export async function getUserTotalScore(userId) {
  // Pastikan userId dikonversi ke BigInt dengan aman
  const uid = BigInt(userId);

  // Cek dulu apakah user ini pernah main?
  // Sebenarnya aggregate bisa langsung, tapi kita pastikan where clause benar
  // participant.userId harus match user.id
  const aggregate = await prisma.sessionTurn.aggregate({
    _sum: {
      score: true
    },
    where: {
      participant: {
        userId: uid
      }
    }
  });

  // FIX: Handle null result
  return aggregate._sum.score || 0;
}