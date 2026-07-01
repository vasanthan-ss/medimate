-- CreateTable
CREATE TABLE "MedicineSchedule" (
    "id" SERIAL NOT NULL,
    "medicineId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "times" TEXT[],
    "daysOfWeek" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicineSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MedicineSchedule_medicineId_idx" ON "MedicineSchedule"("medicineId");

-- CreateIndex
CREATE INDEX "MedicineSchedule_userId_idx" ON "MedicineSchedule"("userId");

-- AddForeignKey
ALTER TABLE "MedicineSchedule" ADD CONSTRAINT "MedicineSchedule_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineSchedule" ADD CONSTRAINT "MedicineSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
