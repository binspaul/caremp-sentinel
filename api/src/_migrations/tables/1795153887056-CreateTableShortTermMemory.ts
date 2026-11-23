import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableShortTermMemory1795153887056 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "short_term_memory" (
            "id" SERIAL PRIMARY KEY,
            "memoryText" TEXT NOT NULL,
            "expiresAt" TIMESTAMP NOT NULL,
            "isExpired" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "createdBy" INTEGER,
            "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedBy" INTEGER,
            "residentId" INTEGER NOT NULL,

            CONSTRAINT "FK_short_term_memory_resident"
              FOREIGN KEY ("residentId")
              REFERENCES "resident" ("id")
              ON DELETE CASCADE
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_short_term_memory_residentId"
            ON "short_term_memory" ("residentId");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_short_term_memory_residentId";
        `);

        await queryRunner.query(`
            DROP TABLE IF EXISTS "short_term_memory";
        `);
    }

}
