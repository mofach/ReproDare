// prisma/seed.js
/**
 * Robust seeder for Reprodare.
 * - Detects column names dynamically (password vs password_hash, createdBy vs created_by)
 * - Safe to run multiple times (clears tables first)
 *
 * Place this file at: server/prisma/seed.js
 */

import prisma from '../src/prisma/index.js';
import bcrypt from 'bcryptjs';

async function hasColumn(tableName, columnName) {
  // query information_schema for PostgreSQL (works on typical Postgres setups)
  const rows = await prisma.$queryRawUnsafe(
    `SELECT column_name FROM information_schema.columns WHERE lower(table_name) = lower($1) AND lower(column_name) = lower($2)`,
    tableName,
    columnName
  );
  return Array.isArray(rows) && rows.length > 0;
}

function pick(obj, keyA, keyB) {
  // choose which key exists on obj (not used here, just helper)
  if (obj && Object.prototype.hasOwnProperty.call(obj, keyA)) return keyA;
  if (obj && Object.prototype.hasOwnProperty.call(obj, keyB)) return keyB;
  return null;
}

async function main() {
  console.log('🌱 Starting database seeding (robust)...');

  // ---- Clean existing data (dev only) ----
  // Order matters because of FKs
  try {
    await prisma.sessionTurn.deleteMany();
    await prisma.sessionParticipant.deleteMany();
    await prisma.session.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.card.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    console.log('✓ Cleared existing data');
  } catch (e) {
    console.warn('Warning: failed clearing some tables (maybe they do not exist yet):', e.message);
  }

  // ---- Detect column names we will use ----
  // For users: password field could be 'password' or 'password_hash'
  const userHasPasswordHash = await hasColumn('User', 'password_hash') || await hasColumn('user', 'password_hash');
  const userHasPassword = await hasColumn('User', 'password') || await hasColumn('user', 'password');

  // For createdBy on category/card: could be 'createdBy' or 'created_by' or 'createdById'
  const categoryHasCreatedByCamel = await hasColumn('Category', 'createdBy') || await hasColumn('category', 'createdBy');
  const categoryHasCreatedBySnake = await hasColumn('Category', 'created_by') || await hasColumn('category', 'created_by');
  const cardHasCreatedByCamel = await hasColumn('Card', 'createdBy') || await hasColumn('card', 'createdBy');
  const cardHasCreatedBySnake = await hasColumn('Card', 'created_by') || await hasColumn('card', 'created_by');

  console.log('Detected columns: user.password_hash=', userHasPasswordHash, ' user.password=', userHasPassword);
  console.log('category.createdBy camel=', categoryHasCreatedByCamel, ' snake=', categoryHasCreatedBySnake);
  console.log('card.createdBy camel=', cardHasCreatedByCamel, ' snake=', cardHasCreatedBySnake);

  // ---- Create users ----
  const passwordAdminPlain = 'admin123';
  const passwordTeacherPlain = 'pirda123';
  const passwordStudentPlain = 'aqil123';

  const hashedAdmin = await bcrypt.hash(passwordAdminPlain, 10);
  const hashedTeacher = await bcrypt.hash(passwordTeacherPlain, 10);
  const hashedStudent = await bcrypt.hash(passwordStudentPlain, 10);

  // build data objects adaptively
  const adminData = {
    name: 'Super Admin',
    email: 'admin@example.com',
    role: 'admin',
  };
  const teacherData = {
    name: 'Bu Pirda',
    email: 'pirda@example.com',
    role: 'teacher',
  };
  const studentData = {
    name: 'Aqil',
    email: 'aqil@example.com',
    role: 'student',
  };

  if (userHasPasswordHash) {
    adminData.password_hash = hashedAdmin;
    teacherData.password_hash = hashedTeacher;
    studentData.password_hash = hashedStudent;
  } else if (userHasPassword) {
    adminData.password = hashedAdmin;
    teacherData.password = hashedTeacher;
    studentData.password = hashedStudent;
  } else {
    // fallback: try to set 'password' anyway; will fail if schema differs
    adminData.password = hashedAdmin;
    teacherData.password = hashedTeacher;
    studentData.password = hashedStudent;
    console.warn('No recognizable password column detected; attempted to write "password" field as fallback.');
  }

  // insert users
  const admin = await prisma.user.create({ data: adminData });
  const teacher = await prisma.user.create({ data: teacherData });
  const student = await prisma.user.create({ data: studentData });

  console.log('✓ Users created:', {
    admin: { id: String(admin.id), email: admin.email },
    teacher: { id: String(teacher.id), email: teacher.email },
    student: { id: String(student.id), email: student.email },
  });

  // ---- Create categories ----
  // Build category creation payloads with correct createdBy prop name
  function makeCategoryPayload(name, description, createdById) {
    const base = { name, description };
    if (categoryHasCreatedByCamel) base.createdBy = createdById;
    else if (categoryHasCreatedBySnake) base.created_by = createdById;
    else base.createdBy = createdById; // fallback
    return base;
  }

  const catRelasi = makeCategoryPayload('Relasi Sosial', 'Pertanyaan seputar hubungan sosial, komunikasi, dan interaksi.', admin.id);
  const catMental = makeCategoryPayload('Kesehatan Mental', 'Pertanyaan mengenai perasaan, stres, kecemasan, dan emosi.', admin.id);
  const catPubertas = makeCategoryPayload('Pubertas', 'Topik tentang perubahan fisik, emosi, dan perkembangan diri.', admin.id);

  const relasi = await prisma.category.create({ data: catRelasi });
  const mental = await prisma.category.create({ data: catMental });
  const pubertas = await prisma.category.create({ data: catPubertas });

  console.log('✓ Categories created:', { relasiId: String(relasi.id), mentalId: String(mental.id), pubertasId: String(pubertas.id) });

  // ---- Create cards ----
  function makeCardPayload(categoryId, type, content, createdById) {
    const base = { categoryId, type, content };
    if (cardHasCreatedByCamel) base.createdBy = createdById;
    else if (cardHasCreatedBySnake) base.created_by = createdById;
    else base.createdBy = createdById;
    return base;
  }

  // create cards one-by-one to be safe
  const cardsData = [
    makeCardPayload(relasi.id, 'truth', 'Apa hal paling sulit dari menjaga hubungan pertemanan?', admin.id),
    makeCardPayload(relasi.id, 'dare', 'Sebutkan satu teman yang paling kamu percaya dan alasannya.', admin.id),
    makeCardPayload(mental.id, 'truth', 'Apa hal yang paling membuatmu stres belakangan ini?', admin.id),
    makeCardPayload(mental.id, 'dare', 'Tuliskan 3 hal yang kamu syukuri hari ini.', admin.id),
    makeCardPayload(pubertas.id, 'truth', 'Apa perubahan terbesar yang kamu alami selama pubertas?', admin.id),
    makeCardPayload(pubertas.id, 'dare', 'Sebutkan satu hal yang ingin kamu pelajari tentang pubertas.', admin.id),
  ];

  for (const cd of cardsData) {
    await prisma.card.create({ data: cd });
  }

  console.log('✓ Cards created (sample set)');

  console.log('🌱 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
