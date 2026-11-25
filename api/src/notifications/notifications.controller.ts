import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  Version,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/interfaces/role.interface';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { QueryNotificationDto } from './dtos/query-notification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Get notification counters (unread, critical, totals)
   */
  @Get('counters')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async counters() {
    const data = await this.notificationsService.getCounters();
    return {
      code: 200,
      status: 'success',
      message: 'Notification counters fetched successfully.',
      data,
    };
  }

  /**
   * List notifications with pagination, filters, and search
   */
  @Get()
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll(@Query(new ValidationPipe({ transform: true })) query: QueryNotificationDto) {
    const { data, total } = await this.notificationsService.findAll(query);
    return {
      code: 200,
      status: 'success',
      message: 'Notifications fetched successfully.',
      data,
      pagination: {
        total,
        skip: query.skip || 0,
        limit: query.limit || 20,
      },
    };
  }

  /**
   * Mark all unread notifications as read
   */
  @Patch('read-all')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async markAllAsRead() {
    const result = await this.notificationsService.markAllAsRead();
    return {
      code: 200,
      status: 'success',
      message: 'All notifications marked as read.',
      data: result,
    };
  }

  /**
   * Get single notification by ID
   */
  @Get(':id')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.notificationsService.findOne(id);
    return {
      code: 200,
      status: 'success',
      message: 'Notification fetched successfully.',
      data,
    };
  }

  /**
   * Create a new notification
   */
  @Post()
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@Body(new ValidationPipe({ transform: true })) dto: CreateNotificationDto) {
    const data = await this.notificationsService.create(dto);
    return {
      code: 201,
      status: 'success',
      message: 'Notification created successfully.',
      data,
    };
  }

  /**
   * Mark a notification as read
   */
  @Patch(':id/read')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async markAsRead(@Param('id', ParseIntPipe) id: number) {
    const data = await this.notificationsService.markAsRead(id);
    return {
      code: 200,
      status: 'success',
      message: 'Notification marked as read.',
      data,
    };
  }

  /**
   * Dismiss a notification
   */
  @Patch(':id/dismiss')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async dismiss(@Param('id', ParseIntPipe) id: number) {
    const data = await this.notificationsService.dismiss(id);
    return {
      code: 200,
      status: 'success',
      message: 'Notification dismissed.',
      data,
    };
  }

  /**
   * Soft-delete a notification
   */
  @Delete(':id')
  @Version('1')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.notificationsService.remove(id);
    return {
      code: 200,
      status: 'success',
      message: 'Notification deleted successfully.',
      data,
    };
  }
}
