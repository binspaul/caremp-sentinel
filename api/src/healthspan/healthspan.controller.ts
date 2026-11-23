import {
  Controller,
  Get,
  Post,
  Param,
  Query,
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
import { HealthspanService } from './healthspan.service';
import { SimulateInterventionDto } from './dtos/simulate-intervention.dto';

@Controller('healthspan')
export class HealthspanController {
  constructor(private readonly healthspanService: HealthspanService) {}

  /**
   * Get cohort-wide functional healthspan summary
   */
  @Get('cohort-summary')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getCohortSummary() {
    const data = await this.healthspanService.getCohortSummary();
    return {
      code: 200,
      status: 'success',
      message: 'Cohort healthspan summary fetched successfully.',
      data,
    };
  }

  /**
   * Get latest functional healthspan & biological age clock assessment
   */
  @Get('resident/:residentId/latest')
  @Version('1')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findLatest(
    @Param('residentId', ParseIntPipe) residentId: number,
  ) {
    const data = await this.healthspanService.findLatestByResidentId(residentId);
    return {
      code: 200,
      status: 'success',
      message: 'Latest healthspan assessment fetched successfully.',
      data,
    };
  }

  /**
   * Get historical biological age & frailty trajectory
   */
  @Get('resident/:residentId/history')
  @Version('1')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findHistory(
    @Param('residentId', ParseIntPipe) residentId: number,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
  ) {
    const [data, total] = await this.healthspanService.findHistoryByResidentId(
      residentId,
      limit ? Number(limit) : 50,
      skip ? Number(skip) : 0,
    );
    return {
      code: 200,
      status: 'success',
      message: 'Healthspan assessment history fetched successfully.',
      data,
      pagination: {
        total,
        limit: Number(limit) || 50,
        skip: Number(skip) || 0,
      },
    };
  }

  /**
   * Simulate a multimodal longevity intervention protocol
   */
  @Post('resident/:residentId/simulate-intervention')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async simulateIntervention(
    @Param('residentId', ParseIntPipe) residentId: number,
    @Body(new ValidationPipe({ transform: true })) dto: SimulateInterventionDto,
  ) {
    const data = await this.healthspanService.simulateIntervention(
      residentId,
      dto,
    );
    return {
      code: 201,
      status: 'success',
      message: 'Longevity protocol simulated and biological age clock updated.',
      data,
    };
  }
}
