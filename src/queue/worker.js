const { Worker } = require('bullmq');
const connection = require('./connection');
const { PIPELINE_QUEUE_NAME } = require('./queues');
const logger = require('../lib/logger');
const sendReminderHandler = require('../jobs/handlers/sendReminder');
const checkConfirmationHandler = require('../jobs/handlers/checkConfirmation');
const checkAcknowledgementHandler = require('../jobs/handlers/checkAcknowledgement');
const generateAdherenceSummaryHandler = require('../jobs/handlers/generateAdherenceSummary');
const sendWeeklyDigestHandler = require('../jobs/handlers/sendWeeklyDigest');

const handlers = {
  send_reminder: sendReminderHandler,
  check_confirmation: checkConfirmationHandler,
  check_acknowledgement: checkAcknowledgementHandler,
  generate_adherence_summary: generateAdherenceSummaryHandler,
  send_weekly_digest: sendWeeklyDigestHandler,
};

function createPipelineWorker() {
  const worker = new Worker(
    PIPELINE_QUEUE_NAME,
    async (job) => {
      const handler = handlers[job.name];
      if (!handler) {
        logger.warn({ jobName: job.name, jobId: job.id }, 'no handler registered for job name');
        return;
      }
      return handler(job);
    },
    { connection, concurrency: 10 }
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, jobName: job.name }, 'job completed');
  });
  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, jobName: job?.name, err: err.message }, 'job failed');
  });

  return worker;
}

module.exports = { createPipelineWorker, handlers };
