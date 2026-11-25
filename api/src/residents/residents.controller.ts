import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpStatus,
  HttpException,
  Patch,
  UseGuards,
  ParseIntPipe,
  Version,
  ValidationPipe,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserContext } from 'src/_decorators/user.decorator';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/auth/interfaces/role.interface';
import { RolesGuard } from 'src/auth/role.guard';
import { PaginationQueryDto } from '../_common/dtos/pagination-query.dto';

import { ResidentsService } from './residents.service';
import { CreateResidentDto } from './dtos/create-resident.dto';
import { UpdateResidentDto } from './dtos/update-resident.dto';

@Controller('residents')
export class ResidentsController {
  constructor(
    private readonly residentsService: ResidentsService,
  ) { }

  /**
  * Create new resident
  */
  @Post()
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(
    @Body(new ValidationPipe({ transform: true })) dto: CreateResidentDto,
    @UserContext('id') userId?: number,
  ) {
    try {
      const resident = await this.residentsService.create(dto, userId);

      return {
        code: 201,
        status: 'success',
        message: 'Resident registered successfully.',
        data: resident,
      };
    } catch (error: any) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException({
        status: 'error',
        message: error.message || 'Failed to register resident.',
        data: null,
      });
    }
  }

  /**
  * Get resident counters
  */
  @Get('counters')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async counters(
  ) {
    try {
      const counters = await this.residentsService.getCounters();

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
  * Get resident names list
  */
  @Get('names')
  @Version('1')
  // @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getResidentNames(
    @Query('search') search?: string,
  ) {
    try {
      const residents = await this.residentsService.getResidentNamesList(
        search,
      );

      return {
        code: 200,
        status: 'success',
        message: 'Successfully fetched the resident names.',
        data: residents,
      };
    } catch (error) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed to fetch the resident names.',
        data: null,
      });
    }
  }

  /**
  * Get residents list
  */
  @Get()
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll(
    @Query(new ValidationPipe({ transform: true }))
    query: PaginationQueryDto,
  ) {
    try {
      const {
        skip,
        limit,
      } = query;

      const [data, total] = await this.residentsService.findAll(
        Number(skip),
        Number(limit),
      );

      return {
        code: 200,
        status: 'success',
        message: 'Successfully fetched the residents list.',
        data,
        pagination: { total: total, skip: skip, limit: limit },
      };
    } catch (error) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed to fetch the residents list.',
        data: null,
      });
    }
  }

  /**
  * Get resident details
  */
  @Get(':id')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
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

      return {
        code: 200,
        status: 'success',
        message: 'Resident fetched successfully.',
        data: resident,
      };
    } catch (error) {
      throw new BadRequestException({
        status: 'error',
        message: 'Resident not found.',
        data: null,
      });
    }
  }

  /**
  * Update resident
  */
  @Patch(':id')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateResidentDto,
    @UserContext('id') userId: number,
  ) {
    try {
      if (!userId) {
        throw new HttpException(
          {
            code: 400,
            status: 'error',
            message: 'User id not specified.',
            data: null,
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        dto.updatedBy = userId;
      }

      const updatedResident = await this.residentsService.update(id, dto);
      if (!updatedResident) {
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

      return {
        code: 200,
        status: 'success',
        message: 'Resident updated successfully.',
        data: updatedResident,
      };
    } catch (error) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed to update the resident.',
        data: null,
      });
    }
  }
}
