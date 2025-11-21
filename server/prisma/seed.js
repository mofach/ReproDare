// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const pwd = await bcrypt.hash('admin123', 10);

  // create admin
  await prisma.user.upsert({
    where: { email: 'admin@school.local' },
    update: {},
    create: {
      name: 'Admin Sekolah',
      email: 'admin@school.local',
      password_hash: pwd,
      role: 'admin'
    }
  });

  // teacher
  const tPwd = await bcrypt.hash('guru123', 10);
  const teacher = await prisma.user.upsert({
    where: { email: 'rita@school.local' },
    update: {},
    create: {
      name: 'Bu Rita',
      email: 'rita@school.local',
      password_hash: tPwd,
      role: 'teacher'
    }
  });

  const cat = await prisma.category.upsert({
    where: { name: 'Relasi Sosial' },
    update: {},
    create: {
      name: 'Relasi Sosial',
      description: 'Topik hubungan antar teman',
      created_by: teacher.id
    }
  });

  await prisma.card.createMany({
    data: [
      { categoryId: cat.id, type: 'truth', content: 'Ceritakan pengalaman ketika kamu merasa tertolong.', created_by: teacher.id },
      { categoryId: cat.id, type: 'dare', content: 'Ajak satu temanmu memberi dukungan hari ini.', created_by: teacher.id },
    ]
  });

  console.log('seed done');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
