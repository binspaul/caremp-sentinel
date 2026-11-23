import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

import { User } from '../users/entities/user.entity';

import { seedSuperAdmin, seedDoctorAdmin } from './users.seed';
import { seedRoles } from './roles.seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const userRepo = dataSource.getRepository(User);

  await seedRoles(dataSource);
  await seedSuperAdmin(userRepo);
  await seedDoctorAdmin(userRepo);

  console.info('# Seeding completed successfully.');

  await app.close();
}

bootstrap().catch((err) => {
  console.error('# Error caught while seeding:', err);
});
