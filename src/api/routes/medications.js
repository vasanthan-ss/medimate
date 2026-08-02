const express = require('express');
const prisma = require('../../lib/prisma');
const { requireAuth } = require('../../middleware/auth');
const { validateBody } = require('../../middleware/validate');
const { assertPatientAccess, ForbiddenError } = require('../../lib/assertPatientAccess');
const {
  createMedicationSchema,
  updateMedicationSchema,
} = require('../../validation/medicationSchemas');
const { createScheduleSchema } = require('../../validation/scheduleSchemas');
const { writeAuditLog } = require('../../lib/auditLog');
const { parsePagination } = require('../../lib/pagination');

const router = express.Router();

router.use(requireAuth);

async function resolveTargetPatientId(req, bodyPatientId) {
  if (req.user.role === 'PATIENT') {
    return req.user.id;
  }
  if (!bodyPatientId) {
    throw new ForbiddenError('patientId is required for this role');
  }
  await assertPatientAccess(req.user.id, req.user.role, bodyPatientId);
  return bodyPatientId;
}

router.post('/', validateBody(createMedicationSchema), async (req, res, next) => {
  try {
    const { patientId: bodyPatientId, name, dosage, form, stockQuantity, lowStockThreshold } =
      req.body;
    const patientId = await resolveTargetPatientId(req, bodyPatientId);

    const medication = await prisma.medication.create({
      data: { patientId, name, dosage, form, stockQuantity, lowStockThreshold },
    });

    await writeAuditLog({
      actorId: req.user.id,
      action: 'MEDICATION_CREATED',
      entityType: 'Medication',
      entityId: medication.id,
    });

    return res.status(201).json(medication);
  } catch (err) {
    return next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const patientId =
      req.user.role === 'PATIENT' ? req.user.id : req.query.patientId;
    if (!patientId) {
      return res.status(422).json({ error: 'patientId query param is required for this role' });
    }
    await assertPatientAccess(req.user.id, req.user.role, patientId);

    const { page, limit, skip, take } = parsePagination(req.query);
    const where = { patientId, deletedAt: null };
    const [data, total] = await Promise.all([
      prisma.medication.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.medication.count({ where }),
    ]);

    return res.status(200).json({ data, page, totalPages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const medication = await prisma.medication.findUnique({ where: { id: req.params.id } });
    if (!medication || medication.deletedAt) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    await assertPatientAccess(req.user.id, req.user.role, medication.patientId);
    return res.status(200).json(medication);
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id', validateBody(updateMedicationSchema), async (req, res, next) => {
  try {
    const medication = await prisma.medication.findUnique({ where: { id: req.params.id } });
    if (!medication || medication.deletedAt) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    await assertPatientAccess(req.user.id, req.user.role, medication.patientId);

    const updated = await prisma.medication.update({
      where: { id: medication.id },
      data: req.body,
    });

    await writeAuditLog({
      actorId: req.user.id,
      action: 'MEDICATION_UPDATED',
      entityType: 'Medication',
      entityId: medication.id,
      metadata: { fields: Object.keys(req.body) },
    });

    return res.status(200).json(updated);
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const medication = await prisma.medication.findUnique({ where: { id: req.params.id } });
    if (!medication || medication.deletedAt) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    await assertPatientAccess(req.user.id, req.user.role, medication.patientId);

    await prisma.medication.update({
      where: { id: medication.id },
      data: { active: false, deletedAt: new Date() },
    });

    await writeAuditLog({
      actorId: req.user.id,
      action: 'MEDICATION_DELETED',
      entityType: 'Medication',
      entityId: medication.id,
    });

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/schedules', validateBody(createScheduleSchema), async (req, res, next) => {
  try {
    const medication = await prisma.medication.findUnique({ where: { id: req.params.id } });
    if (!medication || medication.deletedAt) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    await assertPatientAccess(req.user.id, req.user.role, medication.patientId);

    const schedule = await prisma.schedule.create({
      data: { medicationId: medication.id, ...req.body },
    });

    await writeAuditLog({
      actorId: req.user.id,
      action: 'SCHEDULE_CREATED',
      entityType: 'Schedule',
      entityId: schedule.id,
      metadata: { medicationId: medication.id },
    });

    return res.status(201).json(schedule);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
