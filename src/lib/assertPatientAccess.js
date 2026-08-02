const prisma = require('./prisma');

class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ForbiddenError';
    this.status = 403;
  }
}

async function assertPatientAccess(userId, userRole, patientId) {
  if (userRole === 'ADMIN') return;

  if (userRole === 'PATIENT') {
    if (userId === patientId) return;
    throw new ForbiddenError('Not authorized for this patient');
  }

  if (userRole === 'CAREGIVER') {
    const link = await prisma.patientCaregiverLink.findFirst({
      where: {
        patientId,
        caregiverId: userId,
        status: 'ACTIVE',
      },
    });
    if (!link) {
      throw new ForbiddenError('Not authorized for this patient');
    }
    return;
  }

  throw new ForbiddenError('Not authorized for this patient');
}

module.exports = { assertPatientAccess, ForbiddenError };
