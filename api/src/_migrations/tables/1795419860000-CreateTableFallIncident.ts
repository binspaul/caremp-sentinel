import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableFallIncident1795419860000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "fall_incident" (
                "id" SERIAL PRIMARY KEY,
                "residentId" INTEGER NOT NULL,
                "bandId" INTEGER DEFAULT NULL,
                "impactForceG" DECIMAL(5,2) NOT NULL DEFAULT 3.40,
                "orientationChangeDeg" DECIMAL(5,1) NOT NULL DEFAULT 88.0,
                "motionlessDurationSeconds" INTEGER NOT NULL DEFAULT 45,
                "severity" VARCHAR(50) NOT NULL DEFAULT 'critical',
                "status" VARCHAR(50) NOT NULL DEFAULT 'unresolved',
                "location" VARCHAR(255) NOT NULL DEFAULT 'Bedroom Bedside',
                "clinicalDescription" VARCHAR(2000) DEFAULT 'Rapid kinematic deceleration followed by loss of thoracic micro-motion.',
                "detectedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "resolvedAt" TIMESTAMPTZ,
                "resolvedBy" VARCHAR(255),
                "resolutionNotes" VARCHAR(2000),
                "isDeleted" BOOLEAN NOT NULL DEFAULT false,
                "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT "FK_fall_incident_resident"
                FOREIGN KEY ("residentId")
                REFERENCES "resident" ("id")
                ON DELETE CASCADE,

                CONSTRAINT "FK_fall_incident_band"
                FOREIGN KEY ("bandId")
                REFERENCES "band" ("id")
                ON DELETE SET NULL
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_fall_incident_residentId"
            ON "fall_incident" ("residentId");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_fall_incident_bandId"
            ON "fall_incident" ("bandId");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_fall_incident_status"
            ON "fall_incident" ("status");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_fall_incident_detectedAt"
            ON "fall_incident" ("detectedAt");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_fall_incident_isDeleted"
            ON "fall_incident" ("isDeleted");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_fall_incident_isDeleted";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_fall_incident_detectedAt";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_fall_incident_status";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_fall_incident_bandId";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_fall_incident_residentId";
        `);

        await queryRunner.query(`
            DROP TABLE IF EXISTS "fall_incident";
        `);
    }
}
