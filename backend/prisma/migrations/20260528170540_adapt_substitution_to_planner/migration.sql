-- DropForeignKey
ALTER TABLE "Substitution" DROP CONSTRAINT "Substitution_classScheduleId_fkey";

-- AlterTable
ALTER TABLE "Substitution" ADD COLUMN     "timeSlotId" TEXT,
ADD COLUMN     "weekday" "Weekday",
ALTER COLUMN "classScheduleId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Substitution_absenceId_idx" ON "Substitution"("absenceId");

-- CreateIndex
CREATE INDEX "Substitution_originalTeacherId_idx" ON "Substitution"("originalTeacherId");

-- CreateIndex
CREATE INDEX "Substitution_substituteTeacherId_idx" ON "Substitution"("substituteTeacherId");

-- CreateIndex
CREATE INDEX "Substitution_timeSlotId_idx" ON "Substitution"("timeSlotId");

-- AddForeignKey
ALTER TABLE "Substitution" ADD CONSTRAINT "Substitution_classScheduleId_fkey" FOREIGN KEY ("classScheduleId") REFERENCES "ClassSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Substitution" ADD CONSTRAINT "Substitution_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "SchoolTimeSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
