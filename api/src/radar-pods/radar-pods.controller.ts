import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { RadarPodsService } from './radar-pods.service';
import { CreateRadarPodDto } from './dtos/create-radar-pod.dto';
import { UpdateRadarPodDto } from './dtos/update-radar-pod.dto';
import { AssignRadarPodDto } from './dtos/assign-radar-pod.dto';

@Controller('radar-pods')
export class RadarPodsController {
  constructor(private readonly radarPodsService: RadarPodsService) {}

  /**
   * Get radar pods hardware fleet counters
   */
  @Get('counters')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async counters() {
    const counters = await this.radarPodsService.getCounters();
    return {
      code: 200,
      status: 'success',
      message: 'Radar pod fleet counters fetched successfully.',
      data: counters,
    };
  }

  /**
   * Get all radar pods
   */
  @Get()
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll(
    @Query('skip') skip?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('residentId') residentId?: number,
  ) {
    const [data, total] = await this.radarPodsService.findAll({
      skip: skip ? Number(skip) : 0,
      limit: limit ? Number(limit) : 50,
      status,
      search,
      residentId: residentId ? Number(residentId) : undefined,
    });

    return {
      code: 200,
      status: 'success',
      message: 'Radar pods list fetched successfully.',
      data,
      pagination: {
        total,
        skip: Number(skip) || 0,
        limit: Number(limit) || 50,
      },
    };
  }

  /**
   * Get radar pods assigned to a resident
   */
  @Get('resident/:residentId')
  @Version('1')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findByResident(@Param('residentId', ParseIntPipe) residentId: number) {
    const pods = await this.radarPodsService.findByResident(residentId);
    return {
      code: 200,
      status: 'success',
      message: 'Resident radar pods fetched successfully.',
      data: pods,
    };
  }

  /**
   * Get single radar pod by ID
   */
  @Get(':id')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const pod = await this.radarPodsService.findOne(id);
    return {
      code: 200,
      status: 'success',
      message: 'Radar pod details fetched successfully.',
      data: pod,
    };
  }

  /**
   * Register a new radar pod
   */
  @Post()
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@Body(new ValidationPipe({ transform: true })) dto: CreateRadarPodDto) {
    const pod = await this.radarPodsService.create(dto);
    return {
      code: 201,
      status: 'success',
      message: 'Radar pod registered successfully.',
      data: pod,
    };
  }

  /**
   * Update radar pod
   */
  @Patch(':id')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateRadarPodDto,
  ) {
    const pod = await this.radarPodsService.update(id, dto);
    return {
      code: 200,
      status: 'success',
      message: 'Radar pod updated successfully.',
      data: pod,
    };
  }

  /**
   * Assign radar pod to a resident / room
   */
  @Post(':id/assign')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignRadarPodDto,
  ) {
    const pod = await this.radarPodsService.assignToResident(
      id,
      dto.residentId ?? null,
      dto.roomNumber,
    );
    return {
      code: 200,
      status: 'success',
      message: dto.residentId
        ? `Radar pod assigned to resident #${dto.residentId} successfully.`
        : 'Radar pod unassigned successfully.',
      data: pod,
    };
  }

  /**
   * Unassign radar pod
   */
  @Post(':id/unassign')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async unassign(@Param('id', ParseIntPipe) id: number) {
    const pod = await this.radarPodsService.unassignFromResident(id);
    return {
      code: 200,
      status: 'success',
      message: 'Radar pod unassigned successfully.',
      data: pod,
    };
  }

  /**
   * Soft-delete radar pod
   */
  @Delete(':id')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.radarPodsService.remove(id);
    return {
      code: 200,
      status: 'success',
      message: 'Radar pod removed from fleet successfully.',
      data: null,
    };
  }
}
