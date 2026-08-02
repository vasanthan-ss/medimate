const { z } = require('zod');

const createMedicationSchema = z.object({
  patientId: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  dosage: z.string().min(1).max(50),
  form: z.enum(['tablet', 'syrup', 'injection']),
  stockQuantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
});

const updateMedicationSchema = z
  .object({
    name: z.string().min(1).max(100),
    dosage: z.string().min(1).max(50),
    form: z.enum(['tablet', 'syrup', 'injection']),
    stockQuantity: z.number().int().min(0),
    lowStockThreshold: z.number().int().min(0),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });

module.exports = { createMedicationSchema, updateMedicationSchema };
