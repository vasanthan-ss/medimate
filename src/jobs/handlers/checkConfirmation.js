const prisma = require('../../lib/prisma');
const logger = require('../../lib/logger');
const { writeAuditLog } = require('../../lib/auditLog');
const { fireEscalation } = require('../../lib/escalation');

async function checkConfirmationHandler(job) {
  const { intakeLogId } = job.data;

  const result = await prisma.intakeLog.updateMany({
    where: { id: intakeLogId, status: { in: ['PENDING', 'SNOOZED'] } },
    data: { status: 'MISSED' },
  });

  if (result.count === 0) {
    logger.info({ intakeLogId }, 'check_confirmation: already resolved, skipping');
    return;
  }

  await writeAuditLog({
    actorId: 'system',
    action: 'INTAKE_MISSED',
    entityType: 'IntakeLog',
    entityId: intakeLogId,
  });
  logger.info({ intakeLogId }, 'check_confirmation: grace period expired, marked MISSED');

  await fireEscalation(intakeLogId, 1);
}

module.exports = checkConfirmationHandler;
