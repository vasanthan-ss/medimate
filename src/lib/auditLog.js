const prisma = require('./prisma');

async function writeAuditLog({ actorId, action, entityType, entityId, metadata }) {
  await prisma.auditLog.create({
    data: { actorId, action, entityType, entityId, metadata: metadata || undefined },
  });
}

module.exports = { writeAuditLog };
