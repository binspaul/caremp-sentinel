import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableBand1795419850000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "band" (
                "id" SERIAL PRIMARY KEY,
                "serialNumber" VARCHAR(100) NOT NULL,
                "macAddress" VARCHAR(100) NOT NULL,
                "model" VARCHAR(255) DEFAULT 'Sentinel Low-Cost Bio-Pod v1',
                "deviceType" VARCHAR(50) DEFAULT 'wristband',
                "firmwareVersion" VARCHAR(50) DEFAULT 'v1.2.0',
                "batteryLevel" DECIMAL(5,2) DEFAULT 100.00,
                "isWorn" BOOLEAN DEFAULT true,
                "rssi" INTEGER DEFAULT -65,
                "status" VARCHAR(50) DEFAULT 'available',
                "lastSeenAt" TIMESTAMPTZ,
                "notes" VARCHAR(2000) DEFAULT '',
                "isActive" BOOLEAN NOT NULL DEFAULT true,
                "isDeleted" BOOLEAN NOT NULL DEFAULT false,
                "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "assignedResidentId" INTEGER DEFAULT NULL,

                CONSTRAINT "FK_band_resident"
                FOREIGN KEY ("assignedResidentId")
                REFERENCES "resident" ("id")
                ON DELETE SET NULL
            );
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_band_serialNumber"
            ON "band" ("serialNumber");
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_band_macAddress"
            ON "band" ("macAddress");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_band_assignedResidentId"
            ON "band" ("assignedResidentId");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_band_isActive"
            ON "band" ("isActive");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_band_isDeleted"
            ON "band" ("isDeleted");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_band_isDeleted";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_band_isActive";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_band_assignedResidentId";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_band_macAddress";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_band_serialNumber";
        `);

        await queryRunner.query(`
            DROP TABLE IF EXISTS "band";
        `);
    }
}
