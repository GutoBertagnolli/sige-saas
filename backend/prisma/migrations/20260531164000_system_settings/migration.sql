CREATE TABLE IF NOT EXISTS "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SystemSetting_key_key" ON "SystemSetting"("key");

INSERT INTO "SystemSetting" ("id", "key", "value", "createdAt", "updatedAt")
VALUES ('setting-substitution-acceptance-timeout', 'substitutionAcceptanceTimeoutMinutes', '30', now(), now())
ON CONFLICT ("key") DO NOTHING;
