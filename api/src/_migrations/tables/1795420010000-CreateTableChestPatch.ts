import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableChestPatch1795420010000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "chest_patch" (
                "id" SERIAL PRIMARY KEY,
                "serialNumber" VARCHAR(100) NOT NULL,
                "macAddress" VARCHAR(100) NOT NULL,
                "model" VARCHAR(255) DEFAULT 'Sentinel Bio-Patch Hydrogel ECG v3',
                "patchType" VARCHAR(50) DEFAULT 'single_lead_ecg',
                "batteryLevel" DECIMAL(5,2) DEFAULT 100.00,
                "adhesionStatus" VARCHAR(50) DEFAULT 'adhered',
                "wearDurationDays" DECIMAL(4,1) DEFAULT 1.0,
                "maxWearDays" DECIMAL(4,1) DEFAULT 7.0,
                "skinTempCelsius" DECIMAL(4,1) DEFAULT NULL,
                "isWorn" BOOLEAN DEFAULT true,
                "rssi" INTEGER DEFAULT -62,
                "status" VARCHAR(50) DEFAULT 'available',
                "firmwareVersion" VARCHAR(50) DEFAULT 'v3.0.2',
                "lastSeenAt" TIMESTAMPTZ,
                "notes" VARCHAR(2000) DEFAULT '',
                "isActive" BOOLEAN NOT NULL DEFAULT true,
                "isDeleted" BOOLEAN NOT NULL DEFAULT false,
                "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "assignedResidentId" INTEGER DEFAULT NULL,

                CONSTRAINT "FK_chest_patch_resident"
                FOREIGN KEY ("assignedResidentId")
                REFERENCES "resident" ("id")
                ON DELETE SET NULL
            );
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_chest_patch_serialNumber"
            ON "chest_patch" ("serialNumber");
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_chest_patch_macAddress"
            ON "chest_patch" ("macAddress");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_chest_patch_assignedResidentId"
            ON "chest_patch" ("assignedResidentId");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_chest_patch_status"
            ON "chest_patch" ("status");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_chest_patch_isActive"
            ON "chest_patch" ("isActive");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_chest_patch_isDeleted"
            ON "chest_patch" ("isDeleted");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_chest_patch_isDeleted";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_chest_patch_isActive";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_chest_patch_status";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_chest_patch_assignedResidentId";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_chest_patch_macAddress";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_chest_patch_serialNumber";
        `);

        await queryRunner.query(`
            DROP TABLE IF EXISTS "chest_patch";
        `);
    }
}
