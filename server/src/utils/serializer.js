export function sanitize(value) {
  // Recursively convert BigInt to string so JSON serialization works
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = sanitize(v);
    }
    return out;
  }
  return value;
}

// helper to convert only top-level id fields commonly returned by Prisma
export function sanitizeUser(user) {
  if (!user) return user;
  // pick core fields and convert id
  return {
    id: user.id !== undefined ? user.id.toString() : undefined,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at ? user.created_at.toISOString() : undefined,
    updated_at: user.updated_at ? user.updated_at.toISOString() : undefined,
  };
}
