const express = require('express');
const prisma = require('../../lib/prisma');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { assertPatientAccess, ForbiddenError } = require('../../lib/assertPatientAccess');
const { confirmIntakeLog, snoozeIntakeLog } = require('../../lib/intakeConfirmation');
const { parsePagination } = require('../../lib/pagination');

const router = express.Router();

router.use(requireAuth);

async function loadIntakeLogWithPatient(id) {
  return prisma.intakeLog.findUnique({
    where: { id },
    include: { schedule: { include: { medication: { include: { patient: true } } } } },
  });
}

router.post('/:id/confirm', requireRole('PATIENT'), async (req, res, next) => {
  try {
    const log = await loadIntakeLogWithPatient(req.params.id);
    if (!log) return res.status(404).json({ error: 'Intake log not found' });
    if (log.schedule.medication.patient.id !== req.user.id) {
      throw new ForbiddenError('Not authorized for this intake log');
    }

    const { intakeLog, lateConfirmation } = await confirmIntakeLog(log.id, 'APP', req.user.id);
    return res.status(200).json({ ...intakeLog, lateConfirmation });
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/snooze', requireRole('PATIENT'), async (req, res, next) => {
  try {
    const log = await loadIntakeLogWithPatient(req.params.id);
    if (!log) return res.status(404).json({ error: 'Intake log not found' });
    if (log.schedule.medication.patient.id !== req.user.id) {
      throw new ForbiddenError('Not authorized for this intake log');
    }

    const result = await snoozeIntakeLog(log.id, req.user.id);
    if (!result.snoozed) {
      return res.status(409).json({ error: 'This dose has already been snoozed once, or is no longer pending' });
    }
    return res.status(200).json(result.intakeLog);
  } catch (err) {
    return next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const patientId = req.user.role === 'PATIENT' ? req.user.id : req.query.patientId;
    if (!patientId) {
      return res.status(422).json({ error: 'patientId query param is required for this role' });
    }
    await assertPatientAccess(req.user.id, req.user.role, patientId);

    const { page, limit, skip, take } = parsePagination(req.query);
    const where = { schedule: { medication: { patientId } } };
    if (req.query.status) {
      where.status = req.query.status;
    }

    const [data, total] = await Promise.all([
      prisma.intakeLog.findMany({ where, skip, take, orderBy: { scheduledTime: 'desc' } }),
      prisma.intakeLog.count({ where }),
    ]);

    return res.status(200).json({ data, page, totalPages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
