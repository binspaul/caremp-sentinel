import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableResident1795153853161 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "resident" (
            "id" SERIAL PRIMARY KEY,
            "uhid" VARCHAR(255) NOT NULL,
            "firstName" VARCHAR(255) NOT NULL,
            "middleName" VARCHAR(255) DEFAULT '',
            "lastName" VARCHAR(255) NOT NULL,
            "description" VARCHAR(2000) DEFAULT '',
            "emailAddress" VARCHAR(255) NOT NULL,
            "secondaryEmailAddress" VARCHAR(255),
            "phoneNumber" VARCHAR(255) NOT NULL,
            "secondaryPhoneNumber" VARCHAR(255),
            "dateOfBirth" DATE,
            "age" INTEGER DEFAULT 0,
            "gender" INTEGER,
            "bloodGroupId" INTEGER,
            "emergencyContactNumber" VARCHAR(50) NOT NULL,
            "address" VARCHAR(2000) DEFAULT '',
            "notes" VARCHAR(2000) DEFAULT '',
            "specialNotes" VARCHAR(2000) DEFAULT '',
            "avatar" VARCHAR(2000) DEFAULT '',
            "avatarKey" VARCHAR(255) DEFAULT NULL,
            "avatarThumbnailKey" VARCHAR(255) DEFAULT NULL,
            "status" INTEGER NOT NULL DEFAULT 1,
            "referenceHeartRate" DECIMAL(6,2) NOT NULL DEFAULT 75.0,
            "heartRateTolerance" DECIMAL(5,2) DEFAULT 20,
            "referenceHrv" DECIMAL(6,2) DEFAULT 40.0,
            "hrvTolerance" DECIMAL(5,2) DEFAULT 15.0,
            "referenceSystolicBP" INTEGER NOT NULL DEFAULT 120,
            "systolicBPTolerance" DECIMAL(5,2) DEFAULT 20,
            "referenceDiastolicBP" INTEGER NOT NULL DEFAULT 80,
            "diastolicBPTolerance" DECIMAL(5,2) DEFAULT 15,
            "referenceOxygenSaturation" DECIMAL(6,2) NOT NULL DEFAULT 98.0,
            "oxygenSaturationTolerance" DECIMAL(5,2) DEFAULT 5,
            "referenceBodyTemperature" DECIMAL(6,2) NOT NULL DEFAULT 36.8,
            "temperatureToleranceCelsius" DECIMAL(5,2) DEFAULT 1.5,
            "temperatureToleranceFahrenheit" DECIMAL(5,2) DEFAULT 3.0,
            "referenceTemperatureUnit" INTEGER DEFAULT 2,
            "heightCm" DECIMAL(5,2),
            "heightUnit" INTEGER NOT NULL DEFAULT 1,
            "weight" DECIMAL(5,2),
            "weightUnit" INTEGER DEFAULT 1,
            "referenceSleepStatus" INTEGER NOT NULL DEFAULT 0,
            "referenceStepCount" INTEGER NOT NULL DEFAULT 0,
            "referenceDeepSleep" INTEGER DEFAULT 60,
            "referenceDeepSleepTolerance" DECIMAL(5,2) DEFAULT 25,
            "referenceLightSleep" INTEGER DEFAULT 260,
            "referenceLightSleepTolerance" DECIMAL(5,2) DEFAULT 15,
            "referenceRemSleep" INTEGER DEFAULT 90,
            "referenceRemSleepTolerance" DECIMAL(5,2) DEFAULT 20,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "isDeleted" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "createdBy" INTEGER,
            "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedBy" INTEGER,
            "deletedAt" TIMESTAMPTZ,
            "deletedBy" INTEGER,
            "userId" INTEGER,
            CONSTRAINT "FK_resident_user"
            FOREIGN KEY ("userId")
            REFERENCES "user" ("id")
            ON DELETE CASCADE
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_resident_uhid"
            ON "resident" ("uhid");
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_resident_emailAddress"
            ON "resident" ("emailAddress");
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_resident_phoneNumber"
            ON "resident" ("phoneNumber");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_resident_isActive"
            ON "resident" ("isActive");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_resident_isDeleted"
            ON "resident" ("isDeleted");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_resident_userId"
            ON "resident" ("userId");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_resident_userId";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_resident_isDeleted";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_resident_isActive";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_resident_phoneNumber";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_resident_emailAddress";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_resident_uhid";
        `);

        await queryRunner.query(`
            DROP TABLE IF EXISTS "resident";
        `);
    }

}
