import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableUser1795153808174 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "user" (
            "id" SERIAL PRIMARY KEY,
            "firstName" VARCHAR(255) NOT NULL,
            "middleName" VARCHAR(255) DEFAULT '',
            "lastName" VARCHAR(255) NOT NULL,
            "description" VARCHAR(2000) DEFAULT '',
            "password" VARCHAR(255) NOT NULL,
            "emailAddress" VARCHAR(255) NOT NULL,
            "secondaryEmailAddress" VARCHAR(255),
            "phoneNumber" VARCHAR(255) NOT NULL,
            "secondaryPhoneNumber" VARCHAR(255),
            "roleName" VARCHAR(50) DEFAULT 'user',
            "gender" INTEGER,
            "avatar" VARCHAR(2000) DEFAULT NULL,
            "isVerified" BOOLEAN NOT NULL DEFAULT false,
            "isActive" BOOLEAN NOT NULL DEFAULT false,
            "isOnline" BOOLEAN NOT NULL DEFAULT false,
            "lastOnlineAt" TIMESTAMPTZ,
            "isDeleted" BOOLEAN NOT NULL DEFAULT false,
            "title" INTEGER NOT NULL DEFAULT 1,
            "address1" VARCHAR(2000) DEFAULT '',
            "address2" VARCHAR(2000) DEFAULT '',
            "address3" VARCHAR(2000) DEFAULT '',
            "street" VARCHAR(255) DEFAULT '',
            "city" VARCHAR(255) DEFAULT '',
            "state" VARCHAR(255) DEFAULT '',
            "countryId" INTEGER NOT NULL DEFAULT 1,
            "zipCode" VARCHAR(50) DEFAULT '',
            "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "createdBy" INTEGER NOT NULL DEFAULT 1,
            "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedBy" INTEGER DEFAULT NULL,
            "deletedAt" TIMESTAMP,
            "deletedBy" INTEGER,
            "roleId" INTEGER NOT NULL DEFAULT 1
            );
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_emailAddress"
            ON "user" ("emailAddress");
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_phoneNumber"
            ON "user" ("phoneNumber");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_user_phoneNumber";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_user_emailAddress";
        `);

        await queryRunner.query(`
            DROP TABLE IF EXISTS "user";
        `);
    }
}
