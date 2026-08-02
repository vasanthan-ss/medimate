require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12);

  const patient = await prisma.user.upsert({
    where: { email: 'patient@example.com' },
    update: {},
    create: {
      name: 'Rahul K.',
      email: 'patient@example.com',
      passwordHash,
      role: 'PATIENT',
      phone: '+15005550006',
      timezone: 'Asia/Kolkata',
    },
  });

  const caregiver = await prisma.user.upsert({
    where: { email: 'caregiver@example.com' },
    update: {},
    create: {
      name: 'Priya K.',
      email: 'caregiver@example.com',
      passwordHash,
      role: 'CAREGIVER',
      phone: '+15005550007',
      timezone: 'Asia/Kolkata',
    },
  });

  await prisma.patientCaregiverLink.upsert({
    where: { patientId_caregiverId: { patientId: patient.id, caregiverId: caregiver.id } },
    update: {},
    create: {
      patientId: patient.id,
      caregiverId: caregiver.id,
      relationship: 'daughter',
      priority: 1,
      status: 'ACTIVE',
    },
  });

  const medication = await prisma.medication.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      patientId: patient.id,
      name: 'Metformin',
      dosage: '500mg',
      form: 'tablet',
      stockQuantity: 30,
      lowStockThreshold: 5,
    },
  });

  await prisma.schedule.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      medicationId: medication.id,
      timeOfDay: '08:00',
      daysOfWeek: [1, 2, 3, 4, 5],
      gracePeriodMinutes: 45,
    },
  });

  console.log('Seed complete.');
  console.log('  Patient:   patient@example.com   / password123');
  console.log('  Caregiver: caregiver@example.com / password123');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
