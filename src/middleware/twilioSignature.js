const twilio = require('twilio');
const config = require('../lib/config');
const logger = require('../lib/logger');

function verifyTwilioSignature(req, res, next) {
  const signature = req.headers['x-twilio-signature'];
  const url = `${config.publicBaseUrl}${req.originalUrl}`;

  if (!signature || !twilio.validateRequest(config.twilio.authToken, signature, url, req.body)) {
    logger.warn({ url }, 'rejected inbound SMS webhook: invalid Twilio signature');
    return res.status(403).send('Invalid signature');
  }
  next();
}

module.exports = { verifyTwilioSignature };
