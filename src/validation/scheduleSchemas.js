const { z } = require('zod');

const timeOfDayRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const createScheduleSchema = z.object({
  timeOfDay: z.string().regex(timeOfDayRegex, 'timeOfDay must be HH:mm'),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  gracePeriodMinutes: z.number().int().min(1).max(1440).default(45),
});

const updateScheduleSchema = z
  .object({
    timeOfDay: z.string().regex(timeOfDayRegex, 'timeOfDay must be HH:mm'),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1).max(7),
    gracePeriodMinutes: z.number().int().min(1).max(1440),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });

module.exports = { createScheduleSchema, updateScheduleSchema };
