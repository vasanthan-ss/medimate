const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { pipelineQueue } = require('../../queue/queues');

const router = express.Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/jobs/health', async (req, res) => {
  const counts = await pipelineQueue.getJobCounts(
    'waiting',
    'active',
    'delayed',
    'completed',
    'failed'
  );
  return res.status(200).json(counts);
});

module.exports = router;
