import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableDigitalTwin1795153875909 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "digital_twin" (
            "id" SERIAL PRIMARY KEY,
            "residentId" INTEGER NOT NULL,
            "identity" JSONB NOT NULL,
            "body" JSONB NOT NULL,
            "physiology" JSONB NOT NULL,
            "baselines" JSONB NOT NULL,
            "trends" JSONB NOT NULL,
            "correlations" JSONB NOT NULL,
            "healthInsights" JSONB NOT NULL,
            "healthRecords" JSONB NOT NULL,
            "metadata" JSONB NOT NULL,
            CONSTRAINT "FK_digital_twin_resident"
            FOREIGN KEY ("residentId")
            REFERENCES "resident" ("id")
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_digital_twin_residentId"
            ON "digital_twin" ("residentId");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_digital_twin_residentId";
        `);

        await queryRunner.query(`
            DROP TABLE IF EXISTS "digital_twin";
        `);
    }

}
