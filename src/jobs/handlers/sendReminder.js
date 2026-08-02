const prisma = require('../../lib/prisma');
const logger = require('../../lib/logger');
const { sendSms } = require('../../lib/smsGateway');

async function sendReminderHandler(job) {
  const { intakeLogId } = job.data;

  const intakeLog = await prisma.intakeLog.findUnique({
    where: { id: intakeLogId },
    include: { schedule: { include: { medication: { include: { patient: true } } } } },
  });

  if (!intakeLog) {
    logger.warn({ intakeLogId }, 'send_reminder: intake log not found, skipping');
    return;
  }
  if (intakeLog.status !== 'PENDING') {
    logger.info({ intakeLogId, status: intakeLog.status }, 'send_reminder: no longer pending, skipping send');
    return;
  }

  const { medication } = intakeLog.schedule;
  const { patient } = medication;
  if (!patient.phone) {
    logger.warn({ intakeLogId, patientId: patient.id }, 'send_reminder: patient has no phone on file');
    return;
  }

  const body = `MediMate reminder: time to take ${medication.name} (${medication.dosage}). Reply TAKEN once done.`;
  await sendSms(patient.phone, body);
  logger.info({ intakeLogId, scheduleId: intakeLog.scheduleId }, 'send_reminder: reminder sent');
}

module.exports = sendReminderHandler;
