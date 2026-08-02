const prisma = require('./prisma');
const { writeAuditLog } = require('./auditLog');

async function confirmIntakeLog(intakeLogId, method, actorId) {
  const onTime = await prisma.intakeLog.updateMany({
    where: { id: intakeLogId, status: { in: ['PENDING', 'SNOOZED'] } },
    data: { status: 'TAKEN', confirmedAt: new Date(), confirmationMethod: method },
  });

  if (onTime.count > 0) {
    const updated = await prisma.intakeLog.findUnique({ where: { id: intakeLogId } });
    await writeAuditLog({
      actorId: actorId || 'system',
      action: 'INTAKE_CONFIRMED',
      entityType: 'IntakeLog',
      entityId: intakeLogId,
      metadata: { method },
    });
    return { intakeLog: updated, lateConfirmation: false };
  }

  const late = await prisma.intakeLog.updateMany({
    where: { id: intakeLogId, status: 'MISSED' },
    data: { status: 'TAKEN_LATE', confirmedAt: new Date(), confirmationMethod: method },
  });

  if (late.count > 0) {
    const updated = await prisma.intakeLog.findUnique({ where: { id: intakeLogId } });
    await writeAuditLog({
      actorId: actorId || 'system',
      action: 'INTAKE_CONFIRMED_LATE',
      entityType: 'IntakeLog',
      entityId: intakeLogId,
      metadata: { method },
    });
    return { intakeLog: updated, lateConfirmation: true };
  }

  const current = await prisma.intakeLog.findUnique({ where: { id: intakeLogId } });
  return { intakeLog: current, lateConfirmation: current ? current.status === 'TAKEN_LATE' : null };
}

async function snoozeIntakeLog(intakeLogId, actorId) {
  const result = await prisma.intakeLog.updateMany({
    where: { id: intakeLogId, status: 'PENDING', snoozedAt: null },
    data: { status: 'SNOOZED', snoozedAt: new Date() },
  });

  if (result.count === 0) {
    return { snoozed: false };
  }

  await writeAuditLog({
    actorId: actorId || 'system',
    action: 'INTAKE_SNOOZED',
    entityType: 'IntakeLog',
    entityId: intakeLogId,
  });

  const updated = await prisma.intakeLog.findUnique({ where: { id: intakeLogId } });
  return { snoozed: true, intakeLog: updated };
}

module.exports = { confirmIntakeLog, snoozeIntakeLog };
