const express = require('express');
const { DateTime } = require('luxon');
const prisma = require('../../lib/prisma');
const { requireAuth } = require('../../middleware/auth');
const { assertPatientAccess } = require('../../lib/assertPatientAccess');
const { getLiveAdherence } = require('../../lib/adherence');
const { parsePagination } = require('../../lib/pagination');
const { generateAdherencePdf } = require('../../lib/pdfReport');

const router = express.Router();

router.use(requireAuth);

async function loadPatientOr404(patientId, res) {
  const patient = await prisma.user.findUnique({ where: { id: patientId } });
  if (!patient || patient.role !== 'PATIENT') {
    res.status(404).json({ error: 'Patient not found' });
    return null;
  }
  return patient;
}

router.get('/:id/adherence', async (req, res, next) => {
  try {
    await assertPatientAccess(req.user.id, req.user.role, req.params.id);
    const patient = await loadPatientOr404(req.params.id, res);
    if (!patient) return undefined;

    const period = req.query.period === 'monthly' ? 'monthly' : 'weekly';
    const result = await getLiveAdherence(patient.id, period, patient.timezone);
    return res.status(200).json({ period, ...result });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/adherence/report.pdf', async (req, res, next) => {
  try {
    await assertPatientAccess(req.user.id, req.user.role, req.params.id);
    const patient = await loadPatientOr404(req.params.id, res);
    if (!patient) return undefined;

    const period = req.query.period === 'monthly' ? 'monthly' : 'weekly';
    const adherence = await getLiveAdherence(patient.id, period, patient.timezone);
    const recentMissed = await prisma.intakeLog.findMany({
      where: {
        schedule: { medication: { patientId: patient.id } },
        status: 'MISSED',
        scheduledTime: { gte: adherence.periodStart, lt: adherence.periodEnd },
      },
      include: { schedule: { include: { medication: true } } },
      orderBy: { scheduledTime: 'desc' },
      take: 20,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="adherence-${patient.id}-${period}.pdf"`);
    generateAdherencePdf(res, { patient, period, adherence, recentMissed });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/timeline', async (req, res, next) => {
  try {
    await assertPatientAccess(req.user.id, req.user.role, req.params.id);
    const patient = await loadPatientOr404(req.params.id, res);
    if (!patient) return undefined;

    const { page, limit, skip, take } = parsePagination(req.query);
    const where = { schedule: { medication: { patientId: patient.id } } };

    const [rows, total] = await Promise.all([
      prisma.intakeLog.findMany({
        where,
        skip,
        take,
        orderBy: { scheduledTime: 'desc' },
        include: { schedule: { include: { medication: true } } },
      }),
      prisma.intakeLog.count({ where }),
    ]);

    const data = rows.map((log) => ({
      id: log.id,
      medicationName: log.schedule.medication.name,
      dosage: log.schedule.medication.dosage,
      scheduledTime: log.scheduledTime,
      status: log.status,
      confirmedAt: log.confirmedAt,
      confirmationMethod: log.confirmationMethod,
    }));

    return res.status(200).json({ data, page, totalPages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/dashboard', async (req, res, next) => {
  try {
    await assertPatientAccess(req.user.id, req.user.role, req.params.id);
    const patient = await loadPatientOr404(req.params.id, res);
    if (!patient) return undefined;

    const nowLocal = DateTime.fromJSDate(new Date(), { zone: patient.timezone });
    const todayStart = nowLocal.startOf('day').toUTC().toJSDate();
    const todayEnd = nowLocal.endOf('day').toUTC().toJSDate();

    const [todayLogs, missedDoses, adherenceThisWeek] = await Promise.all([
      prisma.intakeLog.findMany({
        where: {
          schedule: { medication: { patientId: patient.id } },
          scheduledTime: { gte: todayStart, lte: todayEnd },
        },
        include: { schedule: { include: { medication: true } } },
        orderBy: { scheduledTime: 'asc' },
      }),
      prisma.intakeLog.findMany({
        where: { schedule: { medication: { patientId: patient.id } }, status: 'MISSED' },
        include: { schedule: { include: { medication: true } } },
        orderBy: { scheduledTime: 'desc' },
        take: 10,
      }),
      getLiveAdherence(patient.id, 'weekly', patient.timezone),
    ]);

    return res.status(200).json({
      patientName: patient.name,
      today: todayLogs.map((log) => ({
        id: log.id,
        medicationName: log.schedule.medication.name,
        scheduledTime: log.scheduledTime,
        status: log.status,
      })),
      missedDoses: missedDoses.map((log) => ({
        id: log.id,
        medicationName: log.schedule.medication.name,
        scheduledTime: log.scheduledTime,
      })),
      adherenceThisWeek,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
