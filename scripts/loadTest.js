require('dotenv').config();
const crypto = require('crypto');
const { DateTime } = require('luxon');
const prisma = require('../src/lib/prisma');
const { pipelineQueue } = require('../src/queue/queues');
const { createPipelineWorker } = require('../src/queue/worker');
const { scheduleDueReminders } = require('../src/jobs/cronScheduler');
const connection = require('../src/queue/connection');

const SCHEDULE_COUNT = parseInt(process.argv[2], 10) || 10_000;
const LOAD_TEST_EMAIL = 'load-test-patient@medimate.local';

async function seed(scheduleCount) {
  await prisma.user.deleteMany({ where: { email: LOAD_TEST_EMAIL } });

  const patient = await prisma.user.create({
    data: {
      name: 'Load Test Patient',
      email: LOAD_TEST_EMAIL,
      passwordHash: 'x',
      role: 'PATIENT',
      phone: '+15005550006',
      timezone: 'Asia/Kolkata',
    },
  });

  const now = new Date();
  const local = DateTime.fromJSDate(now, { zone: patient.timezone });
  const timeOfDay = `${String(local.hour).padStart(2, '0')}:${String(local.minute).padStart(2, '0')}`;
  const dayOfWeek = local.weekday % 7;

  const medications = [];
  const schedules = [];
  for (let i = 0; i < scheduleCount; i++) {
    const medId = crypto.randomUUID();
    const schedId = crypto.randomUUID();
    medications.push({
      id: medId,
      patientId: patient.id,
      name: `LoadTestMed${i}`,
      dosage: '10mg',
      form: 'tablet',
    });
    schedules.push({
      id: schedId,
      medicationId: medId,
      timeOfDay,
      daysOfWeek: [dayOfWeek],
      gracePeriodMinutes: 45,
    });
  }

  const BATCH = 1000;
  for (let i = 0; i < medications.length; i += BATCH) {
    await prisma.medication.createMany({ data: medications.slice(i, i + BATCH) });
  }
  for (let i = 0; i < schedules.length; i += BATCH) {
    await prisma.schedule.createMany({ data: schedules.slice(i, i + BATCH) });
  }

  return { patient, now };
}

async function cleanup(patientId) {
  await prisma.intakeLog.deleteMany({ where: { schedule: { medication: { patientId } } } });
  await prisma.schedule.deleteMany({ where: { medication: { patientId } } });
  await prisma.medication.deleteMany({ where: { patientId } });
  await prisma.user.delete({ where: { id: patientId } });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDrain(expectedCompleted, { pollMs = 200, timeoutMs = 300_000 } = {}) {
  const start = Date.now();
  for (;;) {
    const counts = await pipelineQueue.getJobCounts('waiting', 'active', 'completed', 'failed');
    const done = counts.completed + counts.failed;
    if (done >= expectedCompleted || Date.now() - start > timeoutMs) {
      return { ...counts, elapsedMs: Date.now() - start };
    }
    await sleep(pollMs);
  }
}

async function main() {
  console.log(`MediMate load test — seeding ${SCHEDULE_COUNT} schedules due in the current minute...`);

  await pipelineQueue.obliterate({ force: true });

  const seedStart = Date.now();
  const { patient, now } = await seed(SCHEDULE_COUNT);
  const seedElapsedMs = Date.now() - seedStart;
  console.log(`Seeded ${SCHEDULE_COUNT} schedules in ${seedElapsedMs}ms`);

  console.log('Triggering scheduleDueReminders() directly...');
  const enqueueStart = Date.now();
  const cronResult = await scheduleDueReminders(now);
  const enqueueElapsedMs = Date.now() - enqueueStart;
  console.log(
    `Cron tick: checked ${cronResult.schedulesChecked} schedules, enqueued ${cronResult.enqueuedCount} reminder cycles in ${enqueueElapsedMs}ms`
  );

  console.log('Starting worker to drain the send_reminder queue...');
  const worker = createPipelineWorker();
  const drainStart = Date.now();
  const drainResult = await waitForDrain(cronResult.enqueuedCount);
  const drainElapsedMs = Date.now() - drainStart;
  await worker.close();

  const failureRate = drainResult.completed + drainResult.failed > 0
    ? (drainResult.failed / (drainResult.completed + drainResult.failed)) * 100
    : 0;

  console.log('\n=== Load test results ===');
  console.log(`Schedules seeded:        ${SCHEDULE_COUNT}`);
  console.log(`Seed time:                ${seedElapsedMs}ms`);
  console.log(`Cron enqueue time:         ${enqueueElapsedMs}ms  (${cronResult.enqueuedCount} reminder cycles)`);
  console.log(`Queue drain time:          ${drainElapsedMs}ms`);
  console.log(`Jobs completed:            ${drainResult.completed}`);
  console.log(`Jobs failed:               ${drainResult.failed}`);
  console.log(`Failure rate:              ${failureRate.toFixed(2)}%`);
  console.log(`Throughput (drain phase):  ${(drainResult.completed / (drainElapsedMs / 1000)).toFixed(1)} jobs/sec`);
  console.log('==========================\n');

  console.log('Cleaning up seeded data...');
  await cleanup(patient.id);
  await pipelineQueue.obliterate({ force: true });

  await prisma.$disconnect();
  await pipelineQueue.close();
  await connection.quit();
}

main().catch(async (err) => {
  console.error('Load test failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
