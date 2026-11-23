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

import { CreateDigitalTwinDto } from './dtos/create-digital-twin.dto';
import { DigitalTwinService } from './digital-twin.service';
import { ResidentsService } from 'src/residents/residents.service';

@Controller('digital-twin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.ADMIN, Role.RESIDENT)
export class DigitalTwinController {
  constructor(
    private readonly digitalTwinService: DigitalTwinService,
    private readonly residentsService: ResidentsService,
  ) { }

  @Get('resident/:residentId')
  @Version('1')
  async findOne(
    @Param('residentId', ParseIntPipe) residentId: number,
  ) {
    try {
      if (!residentId) {
        throw new BadRequestException({
          status: 'error',
          message: 'Resident ID is not specified.',
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

      const digitalTwin = await this.digitalTwinService.findByResidentId(Number(residentId));

      if (!digitalTwin) {
        return {
          code: 404,
          status: 'error',
          message: 'Digital twin not found.',
          data: null,
        };
      }

      return {
        code: 200,
        status: 'success',
        message: 'Digital twin details.',
        data: digitalTwin,
      };
    } catch (error) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed to get digital twin details.',
        data: null,
      });
    }
  }

  @Post()
  @Version('1')
  async create(
    @Body(new ValidationPipe({ transform: true }))
    createDigitalTwinDto: CreateDigitalTwinDto,
  ) {
    try {
      const { residentId } = createDigitalTwinDto;

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

      const digitalTwin = await this.digitalTwinService.create(createDigitalTwinDto);

      return {
        code: 200,
        status: 'success',
        message: 'Digital twin created successfully.',
        data: digitalTwin,
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
        message: 'Failed to create digital twin.',
        data: null,
      });
    }
  }
}
