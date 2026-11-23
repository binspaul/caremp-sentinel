import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableVital1795153866067 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "vital" (
            "id" SERIAL PRIMARY KEY,
            "generatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "heartRate" DECIMAL(6,2) DEFAULT 0.0,
            "hrv" DECIMAL(6,2) DEFAULT 0.0,
            "systolicBP" DECIMAL(6,2) DEFAULT 0.0,
            "diastolicBP" DECIMAL(6,2) DEFAULT 0.0,
            "oxygenSaturation" DECIMAL(6,2) DEFAULT 0.0,
            "bodyTemperature" DECIMAL(6,2) DEFAULT 0.0,
            "skinTemperature" DECIMAL(6,2) DEFAULT 0.0,
            "temperatureUnit" INTEGER DEFAULT 2,
            "rssi" DECIMAL DEFAULT 0,
            "deepSleepTime" BIGINT DEFAULT 0,
            "lightSleepTime" BIGINT DEFAULT 0,
            "remSleepTime" BIGINT DEFAULT 0,
            "awakeSleepTime" BIGINT DEFAULT 0,
            "totalSleepTime" BIGINT DEFAULT 0,
            "sleepStatus" INTEGER NOT NULL DEFAULT 0,
            "sleepComputationState" INTEGER NOT NULL DEFAULT 0,
            "sleepValueStable" BOOLEAN NOT NULL DEFAULT false,
            "wearingIndicator" BOOLEAN NOT NULL DEFAULT false,
            "movementDetected" BOOLEAN DEFAULT false,
            "batteryLevel" DECIMAL(6,2) NOT NULL DEFAULT 0.0,
            "payload" JSONB NOT NULL DEFAULT '{}',
            "isDeleted" BOOLEAN NOT NULL DEFAULT false,
            "deletedAt" TIMESTAMPTZ,
            "deletedBy" INTEGER,
            "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "createdBy" INTEGER DEFAULT NULL,
            "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedBy" INTEGER DEFAULT NULL,
            "residentId" INTEGER NOT NULL,

            CONSTRAINT "FK_vital_resident"
            FOREIGN KEY ("residentId")
            REFERENCES "resident" ("id")
            ON DELETE CASCADE
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_vital_residentId_generatedAt"
            ON "vital" ("residentId", "generatedAt");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_vital_residentId_generatedAt";
        `);

        await queryRunner.query(`
            DROP TABLE IF EXISTS "vital";
        `);
    }

}
