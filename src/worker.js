const cron = require('node-cron');
const { createPipelineWorker } = require('./queue/worker');
const { scheduleDueReminders } = require('./jobs/cronScheduler');
const { enqueueGenerateAdherenceSummary, enqueueSendWeeklyDigest } = require('./queue/producers');
const logger = require('./lib/logger');

const worker = createPipelineWorker();

const reminderCronTask = cron.schedule('* * * * *', async () => {
  try {
    const result = await scheduleDueReminders();
    if (result.enqueuedCount > 0) {
      logger.info(result, 'cron tick: enqueued due reminders');
    }
  } catch (err) {
    logger.error({ err }, 'cron tick failed');
  }
});

const adherenceSummaryCronTask = cron.schedule('10 0 * * *', async () => {
  try {
    await enqueueGenerateAdherenceSummary();
  } catch (err) {
    logger.error({ err }, 'generate_adherence_summary cron enqueue failed');
  }
});

const weeklyDigestCronTask = cron.schedule('0 8 * * 1', async () => {
  try {
    await enqueueSendWeeklyDigest();
  } catch (err) {
    logger.error({ err }, 'send_weekly_digest cron enqueue failed');
  }
});

logger.info('MediMate worker started (queue worker + cron scheduler)');

process.on('SIGTERM', async () => {
  reminderCronTask.stop();
  adherenceSummaryCronTask.stop();
  weeklyDigestCronTask.stop();
  await worker.close();
  process.exit(0);
});
