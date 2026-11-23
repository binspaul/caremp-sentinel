import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableLongTermMemory1795153899904 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "long_term_memory" (
            "id" SERIAL PRIMARY KEY,
            "memoryText" TEXT NOT NULL,
            "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "createdBy" INTEGER,
            "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedBy" INTEGER,
            "residentId" INTEGER NOT NULL,

            CONSTRAINT "FK_long_term_memory_resident"
            FOREIGN KEY ("residentId")
            REFERENCES "resident" ("id")
            ON DELETE CASCADE
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_long_term_memory_memoryText"
            ON "long_term_memory" ("memoryText");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_long_term_memory_residentId"
            ON "long_term_memory" ("residentId");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_long_term_memory_residentId";
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_long_term_memory_memoryText";
        `);

        await queryRunner.query(`
            DROP TABLE IF EXISTS "long_term_memory";
        `);
    }

}
