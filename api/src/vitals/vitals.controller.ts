import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Version,
  ValidationPipe,
  ParseIntPipe,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/role.guard';
import { Role } from 'src/auth/interfaces/role.interface';

import { PaginationQueryDto } from '../_common/dtos/pagination-query.dto';

import { ResidentsService } from 'src/residents/residents.service';
import { VitalsService } from './vitals.service';

@Controller('vitals')
export class VitalsController {
  constructor(
    private readonly vitalsService: VitalsService,
    private readonly residentsService: ResidentsService,
  ) { }

  /**
  * Get vitals counters
  */
  @Get('counters')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async counters(
  ) {
    try {
      const counters = await this.vitalsService.getCounters();

      return {
        code: 200,
        status: 'success',
        message: 'Counters fetched successfully.',
        data: counters,
      };
    } catch (error) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed to fetch counters.',
        data: null,
      });
    }
  }

  /**
  * Get vitals list
  */
  @Get()
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.RESIDENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll(
    @Query(new ValidationPipe({ transform: true }))
    query: PaginationQueryDto,
  ) {
    try {
      const {
        skip,
        limit,
        residentId,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      } = query;

      if (residentId) {
        const resident = await this.residentsService.findOne(Number(residentId));

        if (!resident) {
          throw new HttpException(
            {
              code: 404,
              status: 'error',
              message: 'Resident not found.',
              data: null,
            },
            HttpStatus.NOT_FOUND,
          );
        }
      }

      const [data, total] = await this.vitalsService.findAll(
        Number(skip),
        Number(limit),
        residentId ? Number(residentId) : undefined,
        startDate as string,
        endDate as string,
        sortBy,
        sortOrder !== undefined ? Number(sortOrder) : undefined,
      );

      return {
        code: 200,
        status: 'success',
        message: 'Successfully fetched the vitals list.',
        data,
        pagination: { total: total, skip: skip, limit: limit },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException({
        status: 'error',
        message: 'Failed to fetch the vitals list.',
        data: null,
      });
    }
  }

  /**
  * Get vitals  details
  */
  @Get(':id')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.RESIDENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      const resident = await this.residentsService.findOne(Number(id));

      if (!resident) {
        throw new HttpException(
          {
            code: 404,
            status: 'error',
            message: 'Resident not found.',
            data: null,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const vital = await this.vitalsService.findByResidentId(Number(resident.id));

      if (!vital) {
        return {
          code: 404,
          status: 'error',
          message: 'Vital details not found.',
          data: null,
        };
      }

      return {
        code: 200,
        status: 'success',
        message: 'Vital details.',
        data: vital,
      };
    } catch (error) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed to retrieve vital details.',
        data: null,
      });
    }
  }
}
