import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableGenomicProfile1795419900000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "genomic_profile" (
                "id" SERIAL PRIMARY KEY,
                "residentId" INTEGER NOT NULL UNIQUE,
                "overallRiskTier" VARCHAR(50) NOT NULL DEFAULT 'MODERATE',
                "prsScores" JSONB NOT NULL DEFAULT '[]',
                "variants" JSONB NOT NULL DEFAULT '[]',
                "activeMedications" JSONB NOT NULL DEFAULT '[]',
                "activePgxAlerts" JSONB NOT NULL DEFAULT '[]',
                "phenoCalibrations" JSONB NOT NULL DEFAULT '{}',
                "sequencingMeta" JSONB NOT NULL DEFAULT '{}',
                "lastAssessedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "isDeleted" BOOLEAN NOT NULL DEFAULT false,
                "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT "FK_genomic_profile_resident"
                FOREIGN KEY ("residentId")
                REFERENCES "resident" ("id")
                ON DELETE CASCADE
            );
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_genomic_profile_residentId"
            ON "genomic_profile" ("residentId");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_genomic_profile_isDeleted"
            ON "genomic_profile" ("isDeleted");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_genomic_profile_isDeleted";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_genomic_profile_residentId";
        `);

        await queryRunner.query(`
            DROP TABLE IF EXISTS "genomic_profile";
        `);
    }
}
