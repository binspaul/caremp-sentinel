import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  Version,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/interfaces/role.interface';
import { FallsService } from './falls.service';
import { CreateFallIncidentDto } from './dtos/create-fall-incident.dto';
import { ResolveFallIncidentDto } from './dtos/resolve-fall-incident.dto';

@Controller('falls')
export class FallsController {
  constructor(private readonly fallsService: FallsService) {}

  /**
   * Get fall incident counters
   */
  @Get('counters')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async counters() {
    const data = await this.fallsService.getCounters();
    return {
      code: 200,
      status: 'success',
      message: 'Fall counters fetched successfully.',
      data,
    };
  }

  /**
   * Get latest unresolved fall incident (for live emergency alert banner)
   */
  @Get('latest-unresolved')
  @Version('1')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async latestUnresolved(@Query('residentId') residentId?: number) {
    const incident = await this.fallsService.findLatestUnresolved(
      residentId ? Number(residentId) : undefined,
    );
    return {
      code: 200,
      status: 'success',
      message: 'Latest unresolved fall fetched successfully.',
      data: incident,
    };
  }

  /**
   * List all fall incidents
   */
  @Get()
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll(
    @Query('skip') skip?: number,
    @Query('limit') limit?: number,
    @Query('residentId') residentId?: number,
    @Query('status') status?: string,
  ) {
    const [data, total] = await this.fallsService.findAll({
      skip: skip ? Number(skip) : 0,
      limit: limit ? Number(limit) : 50,
      residentId: residentId ? Number(residentId) : undefined,
      status,
    });

    return {
      code: 200,
      status: 'success',
      message: 'Fall incidents list fetched successfully.',
      data,
      pagination: {
        total,
        skip: Number(skip) || 0,
        limit: Number(limit) || 50,
      },
    };
  }

  /**
   * Get specific fall incident by ID
   */
  @Get(':id')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.fallsService.findOne(id);
    return {
      code: 200,
      status: 'success',
      message: 'Fall incident details fetched successfully.',
      data,
    };
  }

  /**
   * Record a new fall detection event (from sensor pod or simulation)
   */
  @Post()
  @Version('1')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(
    @Body(new ValidationPipe({ transform: true })) dto: CreateFallIncidentDto,
  ) {
    const data = await this.fallsService.create(dto);
    return {
      code: 201,
      status: 'success',
      message: 'Fall incident recorded and emergency triage initiated.',
      data,
    };
  }

  /**
   * Resolve a fall incident (confirm false alarm or log emergency dispatch)
   */
  @Post(':id/resolve')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.RESIDENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async resolve(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) dto: ResolveFallIncidentDto,
  ) {
    const data = await this.fallsService.resolve(id, dto);
    return {
      code: 200,
      status: 'success',
      message: 'Fall incident resolved successfully.',
      data,
    };
  }
}
