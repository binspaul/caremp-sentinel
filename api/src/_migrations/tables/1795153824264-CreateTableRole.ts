import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableRole1795153824264 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "role" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL,
        "description" VARCHAR(2000) DEFAULT '',
        "isSystemRole" BOOLEAN NOT NULL DEFAULT false,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "isDeleted" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" INTEGER,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedBy" INTEGER,
        "deletedAt" TIMESTAMP,
        "deletedBy" INTEGER
      );
    `);

        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_role_name"
      ON "role" ("name");
    `);

        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_role_isDeleted"
      ON "role" ("isDeleted");
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_role_isDeleted";
    `);

        await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_role_name";
    `);

        await queryRunner.query(`
      DROP TABLE IF EXISTS "role";
    `);
    }

}
