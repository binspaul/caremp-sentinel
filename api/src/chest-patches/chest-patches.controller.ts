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
import { ChestPatchesService } from './chest-patches.service';
import { CreateChestPatchDto } from './dtos/create-chest-patch.dto';
import { UpdateChestPatchDto } from './dtos/update-chest-patch.dto';
import { AssignChestPatchDto } from './dtos/assign-chest-patch.dto';

@Controller('chest-patches')
export class ChestPatchesController {
  constructor(private readonly chestPatchesService: ChestPatchesService) {}

  /**
   * Get chest patch fleet counters
   */
  @Get('counters')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async counters() {
    const counters = await this.chestPatchesService.getCounters();
    return {
      code: 200,
      status: 'success',
      message: 'Chest patch fleet counters fetched successfully.',
      data: counters,
    };
  }

  /**
   * Get all chest patches
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
    const [data, total] = await this.chestPatchesService.findAll({
      skip: skip ? Number(skip) : 0,
      limit: limit ? Number(limit) : 50,
      status,
      search,
      residentId: residentId ? Number(residentId) : undefined,
    });

    return {
      code: 200,
      status: 'success',
      message: 'Chest patches list fetched successfully.',
      data,
      pagination: {
        total,
        skip: Number(skip) || 0,
        limit: Number(limit) || 50,
      },
    };
  }

  /**
   * Get chest patches assigned to a resident
   */
  @Get('resident/:residentId')
  @Version('1')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findByResident(@Param('residentId', ParseIntPipe) residentId: number) {
    const patches = await this.chestPatchesService.findByResident(residentId);
    return {
      code: 200,
      status: 'success',
      message: 'Resident chest patches fetched successfully.',
      data: patches,
    };
  }

  /**
   * Get single chest patch by ID
   */
  @Get(':id')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const patch = await this.chestPatchesService.findOne(id);
    return {
      code: 200,
      status: 'success',
      message: 'Chest patch details fetched successfully.',
      data: patch,
    };
  }

  /**
   * Register a new chest patch
   */
  @Post()
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@Body(new ValidationPipe({ transform: true })) dto: CreateChestPatchDto) {
    const patch = await this.chestPatchesService.create(dto);
    return {
      code: 201,
      status: 'success',
      message: 'Chest patch registered successfully.',
      data: patch,
    };
  }

  /**
   * Update chest patch
   */
  @Patch(':id')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateChestPatchDto,
  ) {
    const patch = await this.chestPatchesService.update(id, dto);
    return {
      code: 200,
      status: 'success',
      message: 'Chest patch updated successfully.',
      data: patch,
    };
  }

  /**
   * Assign chest patch to a resident
   */
  @Post(':id/assign')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignChestPatchDto,
  ) {
    const patch = await this.chestPatchesService.assignToResident(
      id,
      dto.residentId ?? null,
    );
    return {
      code: 200,
      status: 'success',
      message: dto.residentId
        ? `Chest patch assigned to resident #${dto.residentId} successfully.`
        : 'Chest patch unassigned successfully.',
      data: patch,
    };
  }

  /**
   * Unassign chest patch
   */
  @Post(':id/unassign')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async unassign(@Param('id', ParseIntPipe) id: number) {
    const patch = await this.chestPatchesService.unassignFromResident(id);
    return {
      code: 200,
      status: 'success',
      message: 'Chest patch unassigned successfully.',
      data: patch,
    };
  }

  /**
   * Soft-delete chest patch
   */
  @Delete(':id')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.chestPatchesService.remove(id);
    return {
      code: 200,
      status: 'success',
      message: 'Chest patch removed from fleet successfully.',
      data: null,
    };
  }
}
