-- CreateTable
CREATE TABLE "EmployeeWeeklySchedule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT,
    "timeSlotId" TEXT NOT NULL,
    "weekday" "Weekday" NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT,
    "functionName" TEXT,
    "requiresSubstitution" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeWeeklySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmployeeWeeklySchedule_employeeId_weekday_idx" ON "EmployeeWeeklySchedule"("employeeId", "weekday");

-- CreateIndex
CREATE INDEX "EmployeeWeeklySchedule_schoolId_idx" ON "EmployeeWeeklySchedule"("schoolId");

-- AddForeignKey
ALTER TABLE "EmployeeWeeklySchedule" ADD CONSTRAINT "EmployeeWeeklySchedule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeWeeklySchedule" ADD CONSTRAINT "EmployeeWeeklySchedule_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeWeeklySchedule" ADD CONSTRAINT "EmployeeWeeklySchedule_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeWeeklySchedule" ADD CONSTRAINT "EmployeeWeeklySchedule_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeWeeklySchedule" ADD CONSTRAINT "EmployeeWeeklySchedule_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "SchoolTimeSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
