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
import { BandsService } from './bands.service';
import { CreateBandDto } from './dtos/create-band.dto';
import { UpdateBandDto } from './dtos/update-band.dto';
import { AssignBandDto } from './dtos/assign-band.dto';

@Controller('bands')
export class BandsController {
  constructor(private readonly bandsService: BandsService) {}

  /**
   * Get hardware fleet counters
   */
  @Get('counters')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async counters() {
    const counters = await this.bandsService.getCounters();
    return {
      code: 200,
      status: 'success',
      message: 'Band fleet counters fetched successfully.',
      data: counters,
    };
  }

  /**
   * Get all bands (with optional filter by status or search)
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
    const [data, total] = await this.bandsService.findAll({
      skip: skip ? Number(skip) : 0,
      limit: limit ? Number(limit) : 50,
      status,
      search,
      residentId: residentId ? Number(residentId) : undefined,
    });

    return {
      code: 200,
      status: 'success',
      message: 'Bands list fetched successfully.',
      data,
      pagination: {
        total,
        skip: Number(skip) || 0,
        limit: Number(limit) || 50,
      },
    };
  }

  /**
   * Get bands assigned to a resident
   */
  @Get('resident/:residentId')
  @Version('1')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findByResident(@Param('residentId', ParseIntPipe) residentId: number) {
    const bands = await this.bandsService.findByResident(residentId);
    return {
      code: 200,
      status: 'success',
      message: 'Resident bands fetched successfully.',
      data: bands,
    };
  }

  /**
   * Get single band by ID
   */
  @Get(':id')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const band = await this.bandsService.findOne(id);
    return {
      code: 200,
      status: 'success',
      message: 'Band details fetched successfully.',
      data: band,
    };
  }

  /**
   * Register a new sensor band
   */
  @Post()
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@Body(new ValidationPipe({ transform: true })) dto: CreateBandDto) {
    const band = await this.bandsService.create(dto);
    return {
      code: 201,
      status: 'success',
      message: 'Sensor band registered successfully.',
      data: band,
    };
  }

  /**
   * Update band metadata/configuration
   */
  @Patch(':id')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateBandDto,
  ) {
    const band = await this.bandsService.update(id, dto);
    return {
      code: 200,
      status: 'success',
      message: 'Band updated successfully.',
      data: band,
    };
  }

  /**
   * Assign band to a resident
   */
  @Post(':id/assign')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignBandDto,
  ) {
    const band = await this.bandsService.assignToResident(
      id,
      dto.residentId ?? null,
    );
    return {
      code: 200,
      status: 'success',
      message: dto.residentId
        ? `Band assigned to resident #${dto.residentId} successfully.`
        : 'Band unassigned successfully.',
      data: band,
    };
  }

  /**
   * Unassign band from current resident
   */
  @Post(':id/unassign')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async unassign(@Param('id', ParseIntPipe) id: number) {
    const band = await this.bandsService.unassignFromResident(id);
    return {
      code: 200,
      status: 'success',
      message: 'Band unassigned successfully.',
      data: band,
    };
  }

  /**
   * Soft-delete band from active fleet
   */
  @Delete(':id')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.bandsService.remove(id);
    return {
      code: 200,
      status: 'success',
      message: 'Band removed from fleet successfully.',
      data: null,
    };
  }
}
