import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTableResidentAddHealthScore1795420030000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "resident"
      ADD COLUMN IF NOT EXISTS "healthScore" INTEGER DEFAULT 85;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "resident"
      DROP COLUMN IF EXISTS "healthScore";
    `);
  }
}
