import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerMiddleware } from './_middlewares/logger.middleware';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// Analytics Schedulers
import { AnalyticsSchedulerModule } from './_schedulers/analytics-scheduler.module';
import { VitalsToDigitalTwinModule } from './_schedulers/vitals-to-digital-twin/vitals-to-digital-twin.module';

// Auth
import { AuthModule } from './auth/auth.module';

// Admins
import { Admin } from './admins/entities/admin.entity';

// Residents
import { Resident } from './residents/entities/resident.entity';
import { ResidentsModule } from './residents/residents.module';

// Roles
import { Role } from './roles/entities/role.entity';
import { RolesModule } from './roles/roles.module';

// Users
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';

import { DigitalTwin } from './digital-twin/entities/digital-twin.entity';
import { DigitalTwinModule } from './digital-twin/digital-twin.module';

import { Vital } from './vitals/entities/vital.entity';
import { VitalsModule } from './vitals/vitals.module';

import { ShortTermMemory } from './short-term-memory/entities/short-term-memory.entity';
import { ShortTermMemoryModule } from './short-term-memory/short-term-memory.module';

import { LongTermMemory } from './long-term-memory/entities/long-term-memory.entity';
import { LongTermMemoryModule } from './long-term-memory/long-term-memory.module';

import { SimulationModule } from './simulations/simulation.module';
import { VitalsSchedulerModule } from './_schedulers/vitals-scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: parseInt(config.get('DB_PORT')),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        entities: [
          Admin,
          DigitalTwin,
          Resident,
          Role,
          ShortTermMemory,
          LongTermMemory,
          User,
          Vital,
        ],
        autoLoadEntities: true,
        synchronize: false,
        subscribers: [],
        logging: true,
        migrationsTransactionMode: 'none',
        extra: {
          ssl: false,
        },
      }),
    }),

    ScheduleModule.forRoot(),

    AnalyticsSchedulerModule,
    VitalsToDigitalTwinModule,
    AuthModule,
    DigitalTwinModule,
    ResidentsModule,
    RolesModule,
    SimulationModule,
    ShortTermMemoryModule,
    LongTermMemoryModule,
    UsersModule,
    VitalsModule,

    VitalsSchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');
  }
}
