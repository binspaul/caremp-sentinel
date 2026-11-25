import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTableResidentAddClinicalAndRoomColumns1795420020000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "resident"
      ADD COLUMN IF NOT EXISTS "fallRiskScore" INTEGER DEFAULT 25,
      ADD COLUMN IF NOT EXISTS "hasFallHistory" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "roomNumber" VARCHAR(50) DEFAULT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "resident"
      DROP COLUMN IF EXISTS "fallRiskScore",
      DROP COLUMN IF EXISTS "hasFallHistory",
      DROP COLUMN IF EXISTS "roomNumber";
    `);
  }
}
