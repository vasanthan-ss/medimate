const express = require('express');
const prisma = require('../../lib/prisma');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { writeAuditLog } = require('../../lib/auditLog');
const { parsePagination } = require('../../lib/pagination');

const router = express.Router();

router.use(requireAuth);

router.get('/', requireRole('CAREGIVER', 'ADMIN'), async (req, res) => {
  const caregiverId =
    req.user.role === 'ADMIN' && req.query.caregiverId && req.query.caregiverId !== 'me'
      ? req.query.caregiverId
      : req.user.id;

  const { page, limit, skip, take } = parsePagination(req.query);
  const where = { caregiverId };
  if (req.query.acknowledged === 'false') {
    where.acknowledgedAt = null;
  } else if (req.query.acknowledged === 'true') {
    where.acknowledgedAt = { not: null };
  }

  const [rows, total] = await Promise.all([
    prisma.escalation.findMany({
      where,
      skip,
      take,
      orderBy: { escalatedAt: 'desc' },
      include: {
        intakeLog: { include: { schedule: { include: { medication: { include: { patient: true } } } } } },
      },
    }),
    prisma.escalation.count({ where }),
  ]);

  const data = rows.map((row) => ({
    id: row.id,
    patientName: row.intakeLog.schedule.medication.patient.name,
    medicationName: `${row.intakeLog.schedule.medication.name} ${row.intakeLog.schedule.medication.dosage}`,
    scheduledTime: row.intakeLog.scheduledTime,
    tier: row.tier,
    escalatedAt: row.escalatedAt,
    acknowledgedAt: row.acknowledgedAt,
  }));

  return res.status(200).json({ data, page, totalPages: Math.ceil(total / limit) || 1 });
});

router.post('/:id/acknowledge', requireRole('CAREGIVER', 'ADMIN'), async (req, res) => {
  const escalation = await prisma.escalation.findUnique({ where: { id: req.params.id } });
  if (!escalation) {
    return res.status(404).json({ error: 'Escalation not found' });
  }
  if (req.user.role !== 'ADMIN' && escalation.caregiverId !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized for this escalation' });
  }

  const result = await prisma.escalation.updateMany({
    where: { id: escalation.id, acknowledgedAt: null },
    data: { acknowledgedAt: new Date() },
  });

  if (result.count > 0) {
    await writeAuditLog({
      actorId: req.user.id,
      action: 'ESCALATION_ACKNOWLEDGED',
      entityType: 'Escalation',
      entityId: escalation.id,
    });
  }

  const updated = await prisma.escalation.findUnique({ where: { id: escalation.id } });
  return res.status(200).json(updated);
});

module.exports = router;
