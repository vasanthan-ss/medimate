const pino = require('pino');
const config = require('./config');

const logger = pino({
  level: config.nodeEnv === 'test' ? 'silent' : 'info',
  redact: ['*.phone', '*.email', 'req.headers.authorization'],
});

module.exports = logger;
