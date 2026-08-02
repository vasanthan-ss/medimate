const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  role: z.enum(['PATIENT', 'CAREGIVER']),
  phone: z.string().min(7).max(20).optional(),
  timezone: z.string().min(1).max(64).optional(),
});

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

module.exports = { registerSchema, loginSchema, refreshSchema };
