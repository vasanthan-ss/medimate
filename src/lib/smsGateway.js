const twilio = require('twilio');
const config = require('../lib/config');
const logger = require('../lib/logger');

const isConfigured =
  config.twilio.accountSid.startsWith('AC') && config.twilio.authToken && config.twilio.authToken !== 'changeme';

const client = isConfigured ? twilio(config.twilio.accountSid, config.twilio.authToken) : null;

async function sendSms(toPhone, body) {
  if (!client) {
    logger.info({ toPhone: maskPhone(toPhone), body }, 'SMS (dev fallback, not actually sent)');
    return { sid: 'DEV-FALLBACK', status: 'logged' };
  }
  const message = await client.messages.create({
    to: toPhone,
    from: config.twilio.fromNumber,
    body,
  });
  logger.info({ toPhone: maskPhone(toPhone), sid: message.sid }, 'SMS sent');
  return message;
}

function maskPhone(phone) {
  if (!phone) return phone;
  return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4);
}

module.exports = { sendSms, maskPhone };
