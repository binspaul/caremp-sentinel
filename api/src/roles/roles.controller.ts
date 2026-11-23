import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  Patch,
  Put,
  UseGuards,
  Version,
  ValidationPipe,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';

import { PaginationQueryDto } from 'src/_common/dtos/pagination-query.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserContext } from 'src/_decorators/user.decorator';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/role.guard';
import { Role } from 'src/auth/interfaces/role.interface';

import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';

import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) { }

  /**
  * Get roles counters.
  */
  @Get('counters')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async counters() {
    try {
      const counters = await this.rolesService.getCounters();

      return {
        code: 200,
        status: 'success',
        message: 'Roles counters fetched successfully.',
        data: counters,
      };
    } catch (error) {

      throw new BadRequestException({
        status: 'error',
        message: 'Failed to fetch roles counters.',
        data: null,
      });
    }
  }

  /**
  * Create role
  */
  @Post()
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(
    @Body() dto: CreateRoleDto,
    @UserContext('id') userId: number,
  ) {
    try {
      if (!userId) {
        return {
          code: 404,
          status: 'error',
          message: 'User id is not specified.',
          data: null,
        };
      } else {
        dto.createdBy = userId;
      }

      const existingRole = await this.rolesService.findByName(dto.name);

      if (existingRole) {
        return {
          code: 409,
          status: 'error',
          message: 'Role with similar name already exists.',
          data: null,
        };
      }

      const role = await this.rolesService.create(dto);

      return {
        code: 201,
        status: 'success',
        message: 'Role created successfully.',
        data: role,
      };
    } catch (error) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed to create role.',
        data: null,
      });
    }
  }

  /**
  * Get roles list.
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
      const { skip, limit, showDeleted, sortBy, sortOrder } = query;

      const [data, total] = await this.rolesService.findAll(
        Number(skip),
        Number(limit),
        showDeleted,
        sortBy,
        Number(sortOrder),
      );

      return {
        code: 200,
        status: 'success',
        message: 'Roles list.',
        data,
        pagination: { total: total, skip: skip, limit: limit },
      };
    } catch (error) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed to get roles list.',
        data: null,
      });
    }
  }

  /**
  * Get role details
  */
  @Get(':id')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {

      console.log('# Reached get role method');

      const role = await this.rolesService.findOne(Number(id));

      if (!role) {
        return {
          code: 404,
          status: 'error',
          message: 'Role not found.',
          data: null,
        };
      }

      return {
        code: 200,
        status: 'success',
        message: 'Role details.',
        data: role,
      };
    } catch (error) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed to get role details.',
        data: null,
      });
    }
  }

  /**
  * Update role
  */
  @Patch(':id')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
    @UserContext('id') userId: number,
  ) {
    try {
      if (!userId) {
        return {
          code: 404,
          status: 'error',
          message: 'User id is not specified.',
          data: null,
        };
      } else {
        dto.updatedBy = userId;
      }

      const updatedRole = await this.rolesService.update(Number(id), dto);

      if (!updatedRole) {
        return {
          code: 404,
          status: 'error',
          message: 'Failed to update role.',
          data: null,
        };
      }

      return {
        code: 200,
        status: 'success',
        message: 'Role updated successfully.',
        data: updatedRole,
      };
    } catch (error) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed to update role.',
        data: null,
      });
    }
  }
}
