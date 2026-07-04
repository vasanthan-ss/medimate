-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "ReminderLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "medicineId" INTEGER NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "sentTime" TIMESTAMP(3),
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReminderLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReminderLog_userId_idx" ON "ReminderLog"("userId");

-- CreateIndex
CREATE INDEX "ReminderLog_medicineId_idx" ON "ReminderLog"("medicineId");

-- CreateIndex
CREATE INDEX "ReminderLog_scheduleId_idx" ON "ReminderLog"("scheduleId");

-- CreateIndex
CREATE INDEX "ReminderLog_scheduledTime_idx" ON "ReminderLog"("scheduledTime");

-- CreateIndex
CREATE INDEX "ReminderLog_status_idx" ON "ReminderLog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderLog_userId_scheduleId_scheduledTime_key" ON "ReminderLog"("userId", "scheduleId", "scheduledTime");

-- AddForeignKey
ALTER TABLE "ReminderLog" ADD CONSTRAINT "ReminderLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderLog" ADD CONSTRAINT "ReminderLog_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderLog" ADD CONSTRAINT "ReminderLog_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "MedicineSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
