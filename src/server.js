const createApp = require('./app');
const config = require('./lib/config');
const logger = require('./lib/logger');

const app = createApp();

app.listen(config.port, () => {
  logger.info({ port: config.port }, 'MediMate API listening');
});
