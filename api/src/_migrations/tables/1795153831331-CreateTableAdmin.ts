import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableAdmin1795153831331 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "admin" (
        "id" SERIAL PRIMARY KEY,
        "firstName" VARCHAR(255) NOT NULL,
        "middleName" VARCHAR(255) DEFAULT '',
        "lastName" VARCHAR(255),
        "description" VARCHAR(2000) DEFAULT '',
        "emailAddress" VARCHAR(255) NOT NULL,
        "secondaryEmailAddress" VARCHAR(255),
        "phoneNumber" VARCHAR(255) NOT NULL,
        "secondaryPhoneNumber" VARCHAR(255),
        "avatar" VARCHAR(2000) DEFAULT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "isVerified" BOOLEAN NOT NULL DEFAULT false,
        "isDeleted" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" INTEGER,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedBy" INTEGER,
        "deletedAt" TIMESTAMP,
        "deletedBy" INTEGER,
        "userId" INTEGER
        );
        `);

        await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "IDX_admin_emailAddress"
        ON "admin" ("emailAddress");
        `);

        await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "IDX_admin_phoneNumber"
        ON "admin" ("phoneNumber");
        `);

        await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_admin_isActive"
        ON "admin" ("isActive");
        `);

        await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_admin_isDeleted"
        ON "admin" ("isDeleted");
        `);

        await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_admin_userId"
        ON "admin" ("userId");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
          DROP INDEX IF EXISTS "IDX_admin_userId";
        `);

        await queryRunner.query(`
        DROP INDEX IF EXISTS "IDX_admin_isDeleted";
        `);

        await queryRunner.query(`
        DROP INDEX IF EXISTS "IDX_admin_isActive";
        `);

        await queryRunner.query(`
        DROP INDEX IF EXISTS "IDX_admin_phoneNumber";
        `);

        await queryRunner.query(`
        DROP INDEX IF EXISTS "IDX_admin_emailAddress";
        `);

        await queryRunner.query(`
        DROP TABLE IF EXISTS "admin";
        `);
    }

}
