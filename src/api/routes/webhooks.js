const express = require('express');
const prisma = require('../../lib/prisma');
const logger = require('../../lib/logger');
const { verifyTwilioSignature } = require('../../middleware/twilioSignature');
const { confirmIntakeLog } = require('../../lib/intakeConfirmation');

const router = express.Router();

const CONFIRMATION_WORDS = /^\s*(taken|yes|y|done)\s*[.!]?\s*$/i;

function respondTwiml(res, message) {
  res.type('text/xml');
  const escaped = message ? message.replace(/&/g, '&amp;').replace(/</g, '&lt;') : '';
  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response>${escaped ? `<Message>${escaped}</Message>` : ''}</Response>`);
}

router.post(
  '/sms-inbound',
  express.urlencoded({ extended: false }),
  verifyTwilioSignature,
  async (req, res) => {
    const from = req.body.From;
    const body = (req.body.Body || '').trim();

    if (!from || !CONFIRMATION_WORDS.test(body)) {
      logger.info({ from: from ? '***' : from }, 'sms-inbound: not a recognized confirmation reply');
      return respondTwiml(res);
    }

    const patient = await prisma.user.findFirst({ where: { phone: from, role: 'PATIENT' } });
    if (!patient) {
      logger.warn('sms-inbound: no patient found for inbound phone number');
      return respondTwiml(res);
    }

    const pendingLog = await prisma.intakeLog.findFirst({
      where: {
        status: 'PENDING',
        schedule: { medication: { patientId: patient.id } },
      },
      orderBy: { scheduledTime: 'desc' },
    });

    if (!pendingLog) {
      logger.info({ patientId: patient.id }, 'sms-inbound: no pending intake log to confirm');
      return respondTwiml(res, 'No pending dose found to confirm.');
    }

    await confirmIntakeLog(pendingLog.id, 'SMS_REPLY', patient.id);
    logger.info({ patientId: patient.id, intakeLogId: pendingLog.id }, 'sms-inbound: confirmed via SMS reply');
    return respondTwiml(res, 'Thanks, marked as taken!');
  }
);

module.exports = router;
