-- CreateEnum
CREATE TYPE "IntakeStatus" AS ENUM ('TAKEN', 'SKIPPED', 'MISSED');

-- CreateTable
CREATE TABLE "IntakeLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "medicineId" INTEGER NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "takenTime" TIMESTAMP(3),
    "status" "IntakeStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntakeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IntakeLog_userId_idx" ON "IntakeLog"("userId");

-- CreateIndex
CREATE INDEX "IntakeLog_medicineId_idx" ON "IntakeLog"("medicineId");

-- CreateIndex
CREATE INDEX "IntakeLog_scheduleId_idx" ON "IntakeLog"("scheduleId");

-- CreateIndex
CREATE INDEX "IntakeLog_scheduledTime_idx" ON "IntakeLog"("scheduledTime");

-- CreateIndex
CREATE UNIQUE INDEX "IntakeLog_userId_scheduleId_scheduledTime_key" ON "IntakeLog"("userId", "scheduleId", "scheduledTime");

-- AddForeignKey
ALTER TABLE "IntakeLog" ADD CONSTRAINT "IntakeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeLog" ADD CONSTRAINT "IntakeLog_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeLog" ADD CONSTRAINT "IntakeLog_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "MedicineSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
