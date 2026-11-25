import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableRadarPod1795420000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "radar_pod" (
                "id" SERIAL PRIMARY KEY,
                "serialNumber" VARCHAR(100) NOT NULL,
                "macAddress" VARCHAR(100) NOT NULL,
                "model" VARCHAR(255) DEFAULT 'Sentinel 60GHz FMCW Radar Pod v2',
                "frequencyBand" VARCHAR(50) DEFAULT '60 GHz FMCW',
                "installationType" VARCHAR(50) DEFAULT 'bedhead',
                "detectionRangeMeters" DECIMAL(4,1) DEFAULT 5.0,
                "respirationRateBpm" DECIMAL(5,1) DEFAULT NULL,
                "heartRateBpm" DECIMAL(5,1) DEFAULT NULL,
                "bedOccupancy" BOOLEAN DEFAULT false,
                "firmwareVersion" VARCHAR(50) DEFAULT 'v2.1.0',
                "powerSource" VARCHAR(100) DEFAULT 'ac_line_battery_backup',
                "status" VARCHAR(50) DEFAULT 'standby',
                "isOnline" BOOLEAN NOT NULL DEFAULT true,
                "roomNumber" VARCHAR(50) DEFAULT NULL,
                "lastHeartbeatAt" TIMESTAMPTZ,
                "notes" VARCHAR(2000) DEFAULT '',
                "isActive" BOOLEAN NOT NULL DEFAULT true,
                "isDeleted" BOOLEAN NOT NULL DEFAULT false,
                "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "assignedResidentId" INTEGER DEFAULT NULL,

                CONSTRAINT "FK_radar_pod_resident"
                FOREIGN KEY ("assignedResidentId")
                REFERENCES "resident" ("id")
                ON DELETE SET NULL
            );
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_radar_pod_serialNumber"
            ON "radar_pod" ("serialNumber");
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_radar_pod_macAddress"
            ON "radar_pod" ("macAddress");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_radar_pod_assignedResidentId"
            ON "radar_pod" ("assignedResidentId");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_radar_pod_status"
            ON "radar_pod" ("status");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_radar_pod_isActive"
            ON "radar_pod" ("isActive");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_radar_pod_isDeleted"
            ON "radar_pod" ("isDeleted");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_radar_pod_isDeleted";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_radar_pod_isActive";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_radar_pod_status";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_radar_pod_assignedResidentId";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_radar_pod_macAddress";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_radar_pod_serialNumber";
        `);

        await queryRunner.query(`
            DROP TABLE IF EXISTS "radar_pod";
        `);
    }
}
