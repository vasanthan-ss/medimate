const express = require('express');
const prisma = require('../../lib/prisma');
const { requireAuth } = require('../../middleware/auth');
const { validateBody } = require('../../middleware/validate');
const { assertPatientAccess } = require('../../lib/assertPatientAccess');
const { updateScheduleSchema } = require('../../validation/scheduleSchemas');
const { writeAuditLog } = require('../../lib/auditLog');

const router = express.Router();

router.use(requireAuth);

async function loadScheduleWithPatient(scheduleId) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: { medication: true },
  });
  return schedule;
}

router.patch('/:id', validateBody(updateScheduleSchema), async (req, res, next) => {
  try {
    const schedule = await loadScheduleWithPatient(req.params.id);
    if (!schedule || schedule.medication.deletedAt) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    await assertPatientAccess(req.user.id, req.user.role, schedule.medication.patientId);

    const updated = await prisma.schedule.update({
      where: { id: schedule.id },
      data: req.body,
    });

    await writeAuditLog({
      actorId: req.user.id,
      action: 'SCHEDULE_UPDATED',
      entityType: 'Schedule',
      entityId: schedule.id,
      metadata: { fields: Object.keys(req.body) },
    });

    return res.status(200).json(updated);
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const schedule = await loadScheduleWithPatient(req.params.id);
    if (!schedule || schedule.medication.deletedAt) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    await assertPatientAccess(req.user.id, req.user.role, schedule.medication.patientId);

    await prisma.schedule.update({
      where: { id: schedule.id },
      data: { active: false },
    });

    await writeAuditLog({
      actorId: req.user.id,
      action: 'SCHEDULE_DEACTIVATED',
      entityType: 'Schedule',
      entityId: schedule.id,
    });

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
