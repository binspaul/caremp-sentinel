import { Controller, Post, Body, UseGuards, Version, ValidationPipe, BadRequestException, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/role.guard';
import { Role } from 'src/auth/interfaces/role.interface';

import { SimulationService } from './simulation.service';
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { ResidentsService } from 'src/residents/residents.service';

@Controller('simulations')
export class SimulationController {
  constructor(
    private readonly simulationService: SimulationService,
    private readonly residentsService: ResidentsService,
  ) { }

  @Post()
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.RESIDENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(
    @Body(new ValidationPipe({ transform: true }))
    createSimulationDto: CreateSimulationDto,
  ) {
    try {
      const { residentId, conditionType } = createSimulationDto;

      if (!residentId) {
        throw new BadRequestException({
          status: 'error',
          message: 'Resident id is not specified.',
          data: null,
        });
      }

      if (!conditionType || conditionType < 1 || conditionType > 5) {
        throw new BadRequestException({
          status: 'error',
          message: 'Condition type is not specified.',
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

      const vital = await this.simulationService.simulate(residentId, conditionType);

      return {
        code: 201,
        status: 'success',
        message: 'Simulation created successfully.',
        data: vital,
      };
    } catch (error) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed to create simulation.',
        data: null,
      });
    }
  }
}
