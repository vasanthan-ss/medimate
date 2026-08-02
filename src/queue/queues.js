const { Queue } = require('bullmq');
const connection = require('./connection');

const PIPELINE_QUEUE_NAME = 'medimate-pipeline';

const pipelineQueue = new Queue(PIPELINE_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 10_000 },
    removeOnComplete: { age: 24 * 60 * 60 },
    removeOnFail: false,
  },
});

module.exports = { pipelineQueue, PIPELINE_QUEUE_NAME };
