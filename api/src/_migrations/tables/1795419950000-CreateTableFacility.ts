import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableFacility1795419950000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. facility_floor table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "facility_floor" (
        "id" SERIAL PRIMARY KEY,
        "floorNumber" INTEGER NOT NULL UNIQUE,
        "name" VARCHAR(150) NOT NULL,
        "code" VARCHAR(50) DEFAULT 'FL-01',
        "description" VARCHAR(500),
        "layoutWidth" INTEGER DEFAULT 1000,
        "layoutHeight" INTEGER DEFAULT 600,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. room_zone table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "room_zone" (
        "id" SERIAL PRIMARY KEY,
        "floorId" INTEGER NOT NULL,
        "roomNumber" VARCHAR(50) NOT NULL,
        "name" VARCHAR(150) NOT NULL,
        "zoneType" VARCHAR(50) DEFAULT 'suite',
        "isSafePerimeter" BOOLEAN DEFAULT true,
        "x" INTEGER DEFAULT 0,
        "y" INTEGER DEFAULT 0,
        "width" INTEGER DEFAULT 100,
        "height" INTEGER DEFAULT 100,
        "currentResidentId" INTEGER DEFAULT NULL,
        "maxCapacity" INTEGER DEFAULT 1,
        "description" VARCHAR(500),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "FK_room_zone_floor"
        FOREIGN KEY ("floorId")
        REFERENCES "facility_floor" ("id")
        ON DELETE CASCADE,

        CONSTRAINT "FK_room_zone_resident"
        FOREIGN KEY ("currentResidentId")
        REFERENCES "resident" ("id")
        ON DELETE SET NULL
      );
    `);

    // 3. beacon table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "beacon" (
        "id" SERIAL PRIMARY KEY,
        "zoneId" INTEGER DEFAULT NULL,
        "serialNumber" VARCHAR(100) NOT NULL UNIQUE,
        "macAddress" VARCHAR(50) NOT NULL UNIQUE,
        "model" VARCHAR(100) DEFAULT 'Sentinel BLE Anchor v2',
        "major" INTEGER DEFAULT 1000,
        "minor" INTEGER DEFAULT 2000,
        "rssiCalibrated1m" INTEGER DEFAULT -59,
        "batteryLevel" DECIMAL(5,2) DEFAULT 98.50,
        "status" VARCHAR(50) DEFAULT 'active',
        "txIntervalHz" INTEGER DEFAULT 5,
        "lastHeartbeatAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "FK_beacon_zone"
        FOREIGN KEY ("zoneId")
        REFERENCES "room_zone" ("id")
        ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_room_zone_floorId" ON "room_zone" ("floorId");
      CREATE INDEX IF NOT EXISTS "IDX_room_zone_currentResidentId" ON "room_zone" ("currentResidentId");
      CREATE INDEX IF NOT EXISTS "IDX_beacon_zoneId" ON "beacon" ("zoneId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "beacon";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "room_zone";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "facility_floor";`);
  }
}
