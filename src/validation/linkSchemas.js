const { z } = require('zod');

const createLinkSchema = z.object({
  caregiverEmail: z.string().email().max(255),
  relationship: z.string().min(1).max(50),
  priority: z.number().int().min(1).max(10).default(1),
});

module.exports = { createLinkSchema };
