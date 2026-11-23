import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Version,
  Query,
  ParseIntPipe,
  HttpCode,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from 'src/auth/interfaces/role.interface';
import { PaginationQueryDto } from '../_common/dtos/pagination-query.dto';
import { UserContext } from 'src/_decorators/user.decorator';

import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { DeleteUserDto } from './dtos/delete-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@Body() dto: CreateUserDto) {
    try {
      const user = await this.usersService.create(dto);

      return {
        code: 201,
        status: 'success',
        message: 'User created successfully',
        data: user,
      };
    } catch (error) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed to create user',
        data: null,
      });
    }
  }

  @Get()
  @Version('1')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll(
    @Query(new ValidationPipe({ transform: true })) query: PaginationQueryDto,
    @Query('roleId') roleId?: number,
  ) {
    try {
      const { skip, limit, showDeleted, search, sortBy, sortOrder } = query;

      const [users, total] = await this.usersService.findAll(
        Number(skip),
        Number(limit),
        showDeleted,
        search,
        roleId,
        sortBy,
        sortOrder,
      );

      return {
        code: 200,
        status: 'success',
        message: 'Users fetched successfully',
        data: users,
        pagination: { total, limit, skip },
      };
    } catch (error) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed to fetch users',
        data: null,
      });
    }
  }

  @Get('existingEmail')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async existingEmail(
    @Query('emailAddress') emailAddress: string,
  ) {
    try {
      const existingUser = await this.usersService.existingEmail(emailAddress);

      if (!existingUser) {
        throw new BadRequestException({
          status: 'error',
          message: 'Failed to fetch existing user',
          data: null,
        });
      }

      return {
        code: 200,
        status: 'success',
        message: 'Existing user fetched successfully',
        data: existingUser,
      };
    } catch (error) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed to fetch existing user',
        data: null,
      });
    }
  }

  @Get('existingPhoneNumber')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async existingPhoneNumber(
    @Query('phoneNumber') phoneNumber: string,
  ) {
    try {
      const existingUser = await this.usersService.existingPhoneNumber(phoneNumber);

      if (!existingUser) {
        throw new BadRequestException({
          status: 'error',
          message: 'Failed to fetch existing user',
          data: null,
        });
      }

      return {
        code: 200,
        status: 'success',
        message: 'Existing user fetched successfully',
        data: existingUser,
      };
    } catch (error) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed to fetch existing user',
        data: null,
      });
    }
  }

  @Get('counters')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async counters() {
    try {
      const counters = await this.usersService.counters();

      return {
        code: 200,
        status: 'success',
        message: 'Counters fetched successfully',
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

  @Get(':id')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      const user = await this.usersService.findOne(Number(id));

      if (!user) {
        return {
          code: 404,
          status: 'error',
          message: 'Failed to fetch user details.',
          data: null,
        };
      }

      return {
        code: 200,
        status: 'success',
        message: 'User details fetched successfully',
        data: user,
      };
    } catch (error) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed to fetch user details.',
        data: null,
      });
    }
  }

  @Patch(':id')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @UserContext('id') userId: number,
    @UserContext('role') role: number,
  ) {
    try {
      if (!userId) {
        return {
          code: 404,
          status: 'error',
          message: 'User ID not specified.',
          data: null,
        };
      } else {
        dto.updatedBy = userId;
      }

      const updatedUser = await this.usersService.update(Number(id), dto);

      if (!updatedUser) {
        return {
          code: 404,
          status: 'error',
          message: 'Failed to update user.',
          data: null,
        };
      }

      return {
        code: 200,
        status: 'success',
        message: 'User updated successfully',
        data: updatedUser,
      };
    } catch (error) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed to update user.',
        data: null,
      });
    }
  }
}
