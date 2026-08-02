const { pipelineQueue } = require('./queues');

function reminderJobId(scheduleId, scheduledTime) {
  return `send_reminder__${scheduleId}__${scheduledTime.toISOString()}`;
}

function checkConfirmationJobId(intakeLogId) {
  return `check_confirmation__${intakeLogId}`;
}

function checkAcknowledgementJobId(escalationId) {
  return `check_acknowledgement__${escalationId}`;
}

async function enqueueSendReminder(intakeLog) {
  return pipelineQueue.add(
    'send_reminder',
    { intakeLogId: intakeLog.id },
    { jobId: reminderJobId(intakeLog.scheduleId, intakeLog.scheduledTime) }
  );
}

async function enqueueCheckConfirmation(intakeLog, { delayMs }) {
  return pipelineQueue.add(
    'check_confirmation',
    { intakeLogId: intakeLog.id },
    { jobId: checkConfirmationJobId(intakeLog.id), delay: Math.max(0, delayMs) }
  );
}

async function enqueueCheckAcknowledgement(escalation, { delayMs }) {
  return pipelineQueue.add(
    'check_acknowledgement',
    { escalationId: escalation.id },
    { jobId: checkAcknowledgementJobId(escalation.id), delay: Math.max(0, delayMs) }
  );
}

function dailyJobId(name, now = new Date()) {
  return `${name}__${now.toISOString().slice(0, 10)}`;
}

async function enqueueGenerateAdherenceSummary(now = new Date()) {
  return pipelineQueue.add('generate_adherence_summary', {}, { jobId: dailyJobId('generate_adherence_summary', now) });
}

async function enqueueSendWeeklyDigest(now = new Date()) {
  return pipelineQueue.add('send_weekly_digest', {}, { jobId: dailyJobId('send_weekly_digest', now) });
}

module.exports = {
  enqueueSendReminder,
  enqueueCheckConfirmation,
  enqueueCheckAcknowledgement,
  enqueueGenerateAdherenceSummary,
  enqueueSendWeeklyDigest,
  reminderJobId,
  checkConfirmationJobId,
  checkAcknowledgementJobId,
};
