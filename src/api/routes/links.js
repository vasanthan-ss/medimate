const express = require('express');
const prisma = require('../../lib/prisma');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { validateBody } = require('../../middleware/validate');
const { createLinkSchema } = require('../../validation/linkSchemas');
const { writeAuditLog } = require('../../lib/auditLog');
const { parsePagination } = require('../../lib/pagination');

const router = express.Router();

router.use(requireAuth);

router.post('/', requireRole('PATIENT'), validateBody(createLinkSchema), async (req, res) => {
  const { caregiverEmail, relationship, priority } = req.body;

  const caregiver = await prisma.user.findUnique({ where: { email: caregiverEmail } });
  if (!caregiver || caregiver.role !== 'CAREGIVER') {
    return res.status(422).json({ error: 'No caregiver account found for that email' });
  }

  const existing = await prisma.patientCaregiverLink.findUnique({
    where: { patientId_caregiverId: { patientId: req.user.id, caregiverId: caregiver.id } },
  });
  if (existing) {
    return res.status(409).json({ error: 'A link with this caregiver already exists' });
  }

  const link = await prisma.patientCaregiverLink.create({
    data: {
      patientId: req.user.id,
      caregiverId: caregiver.id,
      relationship,
      priority,
      status: 'PENDING',
    },
  });

  await writeAuditLog({
    actorId: req.user.id,
    action: 'LINK_INVITED',
    entityType: 'PatientCaregiverLink',
    entityId: link.id,
    metadata: { caregiverId: caregiver.id },
  });

  return res.status(201).json(link);
});

router.post('/:id/accept', requireRole('CAREGIVER'), async (req, res) => {
  const link = await prisma.patientCaregiverLink.findUnique({ where: { id: req.params.id } });
  if (!link || link.caregiverId !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized for this link' });
  }
  if (link.status !== 'PENDING') {
    return res.status(409).json({ error: `Link is already ${link.status}` });
  }

  const updated = await prisma.patientCaregiverLink.update({
    where: { id: link.id },
    data: { status: 'ACTIVE' },
  });

  await writeAuditLog({
    actorId: req.user.id,
    action: 'LINK_ACCEPTED',
    entityType: 'PatientCaregiverLink',
    entityId: link.id,
  });

  return res.status(200).json(updated);
});

router.delete('/:id', async (req, res) => {
  const link = await prisma.patientCaregiverLink.findUnique({ where: { id: req.params.id } });
  if (!link || (link.patientId !== req.user.id && link.caregiverId !== req.user.id)) {
    return res.status(403).json({ error: 'Not authorized for this link' });
  }

  if (link.status !== 'REVOKED') {
    await prisma.patientCaregiverLink.update({
      where: { id: link.id },
      data: { status: 'REVOKED' },
    });
    await writeAuditLog({
      actorId: req.user.id,
      action: 'LINK_REVOKED',
      entityType: 'PatientCaregiverLink',
      entityId: link.id,
    });
  }

  return res.status(204).send();
});

router.get('/', async (req, res) => {
  const { page, limit, skip, take } = parsePagination(req.query);
  const where =
    req.user.role === 'CAREGIVER' ? { caregiverId: req.user.id } : { patientId: req.user.id };

  const [data, total] = await Promise.all([
    prisma.patientCaregiverLink.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.patientCaregiverLink.count({ where }),
  ]);

  return res.status(200).json({ data, page, totalPages: Math.ceil(total / limit) || 1 });
});

module.exports = router;
