import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  Version,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/interfaces/role.interface';
import { GenomicsService } from './genomics.service';
import { ReconcileMedicationDto } from './dtos/reconcile-medication.dto';
import { UpdateGenomicProfileDto } from './dtos/update-genomic-profile.dto';

@Controller('genomics')
export class GenomicsController {
  constructor(private readonly genomicsService: GenomicsService) {}

  /**
   * Get cohort genomic counters
   */
  @Get('counters')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async counters() {
    const data = await this.genomicsService.getCounters();
    return {
      code: 200,
      status: 'success',
      message: 'Genomic cohort counters fetched successfully.',
      data,
    };
  }

  /**
   * Get genomic profile for a specific resident
   */
  @Get('resident/:residentId')
  @Version('1')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findByResidentId(
    @Param('residentId', ParseIntPipe) residentId: number,
  ) {
    const data = await this.genomicsService.findByResidentId(residentId);
    return {
      code: 200,
      status: 'success',
      message: 'Resident genomic profile fetched successfully.',
      data,
    };
  }

  /**
   * Actionable CPIC prescription reconciliation (Dr. Sarah Jenkins alternative switch)
   */
  @Post('resident/:residentId/reconcile-medication')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async reconcileMedication(
    @Param('residentId', ParseIntPipe) residentId: number,
    @Body(new ValidationPipe({ transform: true })) dto: ReconcileMedicationDto,
  ) {
    const data = await this.genomicsService.reconcileMedication(
      residentId,
      dto,
    );
    return {
      code: 200,
      status: 'success',
      message: 'Medication reconciled and CPIC alert cleared successfully.',
      data,
    };
  }

  /**
   * Update or seed a resident's genomic profile
   */
  @Post('resident/:residentId/profile')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateProfile(
    @Param('residentId', ParseIntPipe) residentId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateGenomicProfileDto,
  ) {
    const data = await this.genomicsService.updateProfile(residentId, dto);
    return {
      code: 200,
      status: 'success',
      message: 'Resident genomic profile updated successfully.',
      data,
    };
  }
}
