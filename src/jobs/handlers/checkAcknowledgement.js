const prisma = require('../../lib/prisma');
const logger = require('../../lib/logger');
const { fireEscalation } = require('../../lib/escalation');

async function checkAcknowledgementHandler(job) {
  const { escalationId } = job.data;

  const escalation = await prisma.escalation.findUnique({ where: { id: escalationId } });
  if (!escalation) {
    logger.warn({ escalationId }, 'check_acknowledgement: escalation not found');
    return;
  }
  if (escalation.acknowledgedAt) {
    logger.info({ escalationId }, 'check_acknowledgement: already acknowledged, skipping');
    return;
  }

  logger.info(
    { escalationId, tier: escalation.tier },
    'check_acknowledgement: ack window expired, escalating to next tier'
  );
  await fireEscalation(escalation.intakeLogId, escalation.tier + 1);
}

module.exports = checkAcknowledgementHandler;
