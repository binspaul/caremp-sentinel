import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterTableDigitalTwinAddColumnAISummary1795154077721 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "digital_twin"
            ADD COLUMN IF NOT EXISTS "aiSummary" TEXT DEFAULT NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "digital_twin"
            DROP COLUMN IF EXISTS "aiSummary";
        `);
    }

}
