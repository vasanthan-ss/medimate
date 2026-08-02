const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');
const config = require('./lib/config');
const logger = require('./lib/logger');
const authRoutes = require('./api/routes/auth');
const linkRoutes = require('./api/routes/links');
const medicationRoutes = require('./api/routes/medications');
const scheduleRoutes = require('./api/routes/schedules');
const intakeLogRoutes = require('./api/routes/intakeLogs');
const webhookRoutes = require('./api/routes/webhooks');
const adminRoutes = require('./api/routes/admin');
const escalationRoutes = require('./api/routes/escalations');
const patientRoutes = require('./api/routes/patients');
const docsRoutes = require('./api/routes/docs');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: config.corsAllowedOrigins.length ? config.corsAllowedOrigins : false,
    })
  );
  app.use(express.json());
  if (config.nodeEnv !== 'test') {
    app.use(pinoHttp({ logger }));
  }

  app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

  const generalApiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => config.nodeEnv === 'test',
    message: { error: 'Too many requests, please slow down' },
  });
  app.use('/api/v1', generalApiLimiter);

  function makeAuthLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      standardHeaders: true,
      legacyHeaders: false,
      skip: () => config.nodeEnv === 'test',
      message: { error: 'Too many attempts, please try again later' },
    });
  }
  app.use('/api/v1/auth/login', makeAuthLimiter());
  app.use('/api/v1/auth/register', makeAuthLimiter());

  const webhookLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => config.nodeEnv === 'test',
  });
  app.use('/api/v1/webhooks/sms-inbound', webhookLimiter);

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/links', linkRoutes);
  app.use('/api/v1/medications', medicationRoutes);
  app.use('/api/v1/schedules', scheduleRoutes);
  app.use('/api/v1/intake-logs', intakeLogRoutes);
  app.use('/api/v1/webhooks', webhookRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/escalations', escalationRoutes);
  app.use('/api/v1/patients', patientRoutes);

  app.use(
    '/api/v1/docs',
    (req, res, next) => {
      res.removeHeader('Content-Security-Policy');
      next();
    },
    docsRoutes
  );

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((err, req, res, next) => {
    logger.error({ err }, 'unhandled error');
    const status = err.status || 500;
    res.status(status).json({ error: status === 500 ? 'Internal server error' : err.message });
  });

  return app;
}

module.exports = createApp;
