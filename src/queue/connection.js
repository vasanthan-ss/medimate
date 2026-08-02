const IORedis = require('ioredis');
const config = require('../lib/config');

const connection = new IORedis(config.redisUrl, { maxRetriesPerRequest: null });

module.exports = connection;
