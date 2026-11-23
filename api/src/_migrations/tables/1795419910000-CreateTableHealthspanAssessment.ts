import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableHealthspanAssessment1795419910000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "healthspan_assessment" (
                "id" SERIAL PRIMARY KEY,
                "residentId" INTEGER NOT NULL,
                "generatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "chronologicalAge" INTEGER NOT NULL DEFAULT 72,
                "biologicalAge" DECIMAL(5,1) NOT NULL DEFAULT 72.0,
                "biologicalAgeDelta" DECIMAL(5,1) NOT NULL DEFAULT 0.0,
                "frailtyIndex" DECIMAL(5,3) NOT NULL DEFAULT 0.120,
                "classification" VARCHAR(50) NOT NULL DEFAULT 'ROBUST',
                "sarcopeniaRisk" VARCHAR(50) NOT NULL DEFAULT 'LOW',
                "mobilityCadenceScore" DECIMAL(5,2) NOT NULL DEFAULT 80.00,
                "autonomicResilience" DECIMAL(5,2) NOT NULL DEFAULT 75.00,
                "contributingDeficits" JSONB NOT NULL DEFAULT '[]',
                "longevityInterventions" JSONB NOT NULL DEFAULT '[]',
                "protocolPhase" VARCHAR(50) NOT NULL DEFAULT 'baseline',
                "source" VARCHAR(100) NOT NULL DEFAULT 'rockwood-clock',
                "isDeleted" BOOLEAN NOT NULL DEFAULT false,
                "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT "FK_healthspan_assessment_resident"
                FOREIGN KEY ("residentId")
                REFERENCES "resident" ("id")
                ON DELETE CASCADE
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_healthspan_residentId_generatedAt"
            ON "healthspan_assessment" ("residentId", "generatedAt");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_healthspan_isDeleted"
            ON "healthspan_assessment" ("isDeleted");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_healthspan_isDeleted";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_healthspan_residentId_generatedAt";
        `);

        await queryRunner.query(`
            DROP TABLE IF EXISTS "healthspan_assessment";
        `);
    }
}
