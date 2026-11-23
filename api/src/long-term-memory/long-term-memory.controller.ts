import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Version,
  ParseIntPipe,
  BadRequestException,
  NotFoundException,
  ValidationPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/role.guard';
import { Role } from 'src/auth/interfaces/role.interface';

import { CreateLongTermMemoryDto } from './dtos/create-long-term-memory.dto';
import { LongTermMemoryService } from './long-term-memory.service';
import { ResidentsService } from 'src/residents/residents.service';

@Controller('long-term-memory')
export class LongTermMemoryController {
  constructor(
    private readonly longTermMemoryService: LongTermMemoryService,
    private readonly residentsService: ResidentsService,
  ) { }

  @Get(':residentId')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.RESIDENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(
    @Param('residentId', ParseIntPipe) residentId: number,
  ) {
    try {
      if (!residentId) {
        throw new BadRequestException({
          status: 'error',
          message: 'Resident id is not specified.',
          data: null,
        });
      }

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

      const memory = await this.longTermMemoryService.findByResidentId(Number(residentId));

      if (!memory) {
        return {
          code: 404,
          status: 'error',
          message: 'Failed to get long term memory.',
          data: null,
        };
      }

      return {
        code: 200,
        status: 'success',
        message: 'Long term memory details.',
        data: memory,
      };
    } catch (error) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed to get long term memory.',
        data: null,
      });
    }
  }

  @Post()
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.RESIDENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(
    @Body(new ValidationPipe({ transform: true }))
    createLongTermMemoryDto: CreateLongTermMemoryDto,
  ) {
    try {
      const { residentId } = createLongTermMemoryDto;

      if (!residentId) {
        throw new BadRequestException({
          status: 'error',
          message: 'Resident id is not specified.',
          data: null,
        });
      }

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

      const memory = await this.longTermMemoryService.upsert(createLongTermMemoryDto);

      return {
        code: 200,
        status: 'success',
        message: 'Long term memory details.',
        data: memory,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException({
          status: 'error',
          message: error.message,
          data: null,
        });
      }
      throw new BadRequestException({
        status: 'error',
        message: 'Failed to create long term memory.',
        data: null,
      });
    }
  }
}
