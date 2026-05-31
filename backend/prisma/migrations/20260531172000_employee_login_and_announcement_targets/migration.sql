ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "loginEmail" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "initialPassword" TEXT;

UPDATE "Employee"
SET "roleType" = 'ORIENTADOR'
WHERE "roleType" = 'COORDENADOR';

CREATE UNIQUE INDEX IF NOT EXISTS "Employee_userId_key" ON "Employee"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'Employee_userId_fkey'
      AND table_name = 'Employee'
  ) THEN
    ALTER TABLE "Employee"
    ADD CONSTRAINT "Employee_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "targetRoleType" "EmployeeRoleType";
