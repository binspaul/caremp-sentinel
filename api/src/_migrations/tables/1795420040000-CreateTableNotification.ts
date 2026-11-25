import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableNotification1795420040000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER DEFAULT NULL,
        "residentId" INTEGER DEFAULT NULL,
        "type" VARCHAR(50) NOT NULL DEFAULT 'alert',
        "priority" VARCHAR(50) NOT NULL DEFAULT 'medium',
        "title" VARCHAR(255) NOT NULL,
        "message" TEXT NOT NULL,
        "data" JSONB DEFAULT NULL,
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "readAt" TIMESTAMPTZ DEFAULT NULL,
        "isDismissed" BOOLEAN NOT NULL DEFAULT false,
        "isDeleted" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "FK_notification_resident"
        FOREIGN KEY ("residentId")
        REFERENCES "resident" ("id")
        ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notification_userId"
      ON "notification" ("userId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notification_residentId"
      ON "notification" ("residentId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notification_type"
      ON "notification" ("type");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notification_priority"
      ON "notification" ("priority");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notification_isRead"
      ON "notification" ("isRead");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notification_isDismissed"
      ON "notification" ("isDismissed");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notification_isDeleted"
      ON "notification" ("isDeleted");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notification_createdAt"
      ON "notification" ("createdAt");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notification";`);
  }
}
