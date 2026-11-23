import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

import { User } from '../users/entities/user.entity';

import { seedSuperAdmin, seedDoctorAdmin } from './users.seed';
import { seedRoles } from './roles.seed';
import { seedResidents } from './residents.seed';
import { seedBands } from './bands.seed';
import { seedFalls } from './falls.seed';
import { seedGenomics } from './genomics.seed';
import { seedHealthspan } from './healthspan.seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const userRepo = dataSource.getRepository(User);

  await seedRoles(dataSource);
  await seedSuperAdmin(userRepo);
  await seedDoctorAdmin(userRepo);
  await seedResidents(dataSource);
  await seedBands(dataSource);
  await seedFalls(dataSource);
  await seedGenomics(dataSource);
  await seedHealthspan(dataSource);

  console.info('# Seeding completed successfully.');

  await app.close();
}

bootstrap().catch((err) => {
  console.error('# Error caught while seeding:', err);
});
