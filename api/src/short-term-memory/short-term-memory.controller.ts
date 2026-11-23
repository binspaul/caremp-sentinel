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

import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/role.guard';
import { Role } from 'src/auth/interfaces/role.interface';

import { CreateShortTermMemoryDto } from './dtos/create-short-term-memory.dto';
import { ShortTermMemoryService } from './short-term-memory.service';
import { ResidentsService } from 'src/residents/residents.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('short-term-memory')
export class ShortTermMemoryController {
  constructor(
    private readonly shortTermMemoryService: ShortTermMemoryService,
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

      const memory = await this.shortTermMemoryService.findByResidentId(Number(residentId));

      if (!memory) {
        return {
          code: 404,
          status: 'error',
          message: 'Short term memory not found.',
          data: null,
        };
      }

      return {
        code: 200,
        status: 'success',
        message: 'Short term memory details.',
        data: memory,
      };
    } catch (error) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed to retrieve short term memory.',
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
    createShortTermMemoryDto: CreateShortTermMemoryDto,
  ) {
    try {
      const { residentId } = createShortTermMemoryDto;

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

      const memory = await this.shortTermMemoryService.upsert(createShortTermMemoryDto);

      return {
        code: 200,
        status: 'success',
        message: 'Short term memory details.',
        data: memory,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException({
        status: 'error',
        message: 'Failed to create short term memory.',
        data: null,
      });
    }

  }
}
