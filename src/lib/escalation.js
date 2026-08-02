const { Prisma } = require('@prisma/client');
const prisma = require('./prisma');
const logger = require('./logger');
const { writeAuditLog } = require('./auditLog');
const { sendSms } = require('./smsGateway');
const config = require('./config');
const { enqueueCheckAcknowledgement } = require('../queue/producers');

async function getCaregiverForTier(patientId, tier) {
  const link = await prisma.patientCaregiverLink.findFirst({
    where: { patientId, priority: tier, status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' },
    include: { caregiver: true },
  });
  return link ? link.caregiver : null;
}

async function fireEscalation(intakeLogId, tier) {
  const intakeLog = await prisma.intakeLog.findUnique({
    where: { id: intakeLogId },
    include: { schedule: { include: { medication: { include: { patient: true } } } } },
  });
  if (!intakeLog) {
    logger.warn({ intakeLogId, tier }, 'fireEscalation: intake log not found');
    return { fired: false, reason: 'intake_log_not_found' };
  }

  const { medication } = intakeLog.schedule;
  const { patient } = medication;

  const caregiver = await getCaregiverForTier(patient.id, tier);
  if (!caregiver) {
    logger.info(
      { intakeLogId, tier, patientId: patient.id },
      'fireEscalation: no caregiver configured at this tier, no further escalation path'
    );
    return { fired: false, reason: 'no_caregiver_at_tier' };
  }

  let escalation;
  try {
    escalation = await prisma.escalation.create({
      data: { intakeLogId, caregiverId: caregiver.id, tier, channel: 'SMS' },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      logger.info({ intakeLogId, tier }, 'fireEscalation: already fired for this tier, skipping');
      return { fired: false, reason: 'already_fired' };
    }
    throw err;
  }

  await writeAuditLog({
    actorId: 'system',
    action: 'ESCALATION_FIRED',
    entityType: 'Escalation',
    entityId: escalation.id,
    metadata: { intakeLogId, tier, caregiverId: caregiver.id },
  });

  if (caregiver.phone) {
    const body = `MediMate alert: ${patient.name} has not confirmed ${medication.name} (${medication.dosage}), due ${intakeLog.scheduledTime.toISOString()}. Please check in.`;
    await sendSms(caregiver.phone, body);
  } else {
    logger.warn({ caregiverId: caregiver.id }, 'fireEscalation: caregiver has no phone on file');
  }

  logger.info({ intakeLogId, tier, caregiverId: caregiver.id, escalationId: escalation.id }, 'fireEscalation: escalation fired');

  await enqueueCheckAcknowledgement(escalation, {
    delayMs: config.escalationAckWindowMinutes * 60_000,
  });

  return { fired: true, escalation };
}

module.exports = { fireEscalation, getCaregiverForTier };
