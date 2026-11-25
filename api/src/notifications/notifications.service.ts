import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationPriority } from './entities/notification.entity';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { QueryNotificationDto } from './dtos/query-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async findAll(query: QueryNotificationDto): Promise<{ data: Notification[]; total: number }> {
    const {
      skip = 0,
      limit = 20,
      type,
      priority,
      isRead,
      isDismissed,
      residentId,
      search,
    } = query;

    const qb = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.isDeleted = :isDeleted', { isDeleted: false });

    if (type) {
      qb.andWhere('notification.type = :type', { type });
    }

    if (priority) {
      qb.andWhere('notification.priority = :priority', { priority });
    }

    if (isRead !== undefined) {
      qb.andWhere('notification.isRead = :isRead', { isRead });
    }

    if (isDismissed !== undefined) {
      qb.andWhere('notification.isDismissed = :isDismissed', { isDismissed });
    }

    if (residentId) {
      qb.andWhere('notification.residentId = :residentId', { residentId });
    }

    if (search && search.trim()) {
      qb.andWhere(
        '(LOWER(notification.title) LIKE :search OR LOWER(notification.message) LIKE :search)',
        { search: `%${search.trim().toLowerCase()}%` },
      );
    }

    qb.orderBy('notification.createdAt', 'DESC')
      .addOrderBy('notification.id', 'DESC')
      .skip(Number(skip))
      .take(Number(limit));

    const [data, total] = await qb.getManyAndCount();

    return { data, total };
  }

  async getCounters(): Promise<{
    total: number;
    unread: number;
    criticalUnread: number;
    byType: Record<string, number>;
  }> {
    const all = await this.notificationRepository.find({
      where: { isDeleted: false, isDismissed: false },
    });

    let unread = 0;
    let criticalUnread = 0;
    const byType: Record<string, number> = {
      fall: 0,
      vital_breach: 0,
      geofence: 0,
      device: 0,
      system: 0,
      alert: 0,
    };

    all.forEach((n) => {
      if (!n.isRead) {
        unread++;
        if (n.priority === NotificationPriority.CRITICAL) {
          criticalUnread++;
        }
      }
      if (byType[n.type] !== undefined) {
        byType[n.type]++;
      } else {
        byType[n.type] = 1;
      }
    });

    return {
      total: all.length,
      unread,
      criticalUnread,
      byType,
    };
  }

  async findOne(id: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!notification) {
      throw new NotFoundException(`Notification #${id} not found.`);
    }

    return notification;
  }

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...dto,
      isRead: dto.isRead ?? false,
      isDismissed: dto.isDismissed ?? false,
      isDeleted: false,
    });

    return await this.notificationRepository.save(notification);
  }

  async markAsRead(id: number): Promise<Notification> {
    const notification = await this.findOne(id);
    notification.isRead = true;
    notification.readAt = new Date();
    return await this.notificationRepository.save(notification);
  }

  async markAllAsRead(): Promise<{ success: boolean; count: number }> {
    const result = await this.notificationRepository.update(
      { isRead: false, isDeleted: false },
      { isRead: true, readAt: new Date() },
    );

    return { success: true, count: result.affected || 0 };
  }

  async dismiss(id: number): Promise<Notification> {
    const notification = await this.findOne(id);
    notification.isDismissed = true;
    return await this.notificationRepository.save(notification);
  }

  async remove(id: number): Promise<Notification> {
    const notification = await this.findOne(id);
    notification.isDeleted = true;
    return await this.notificationRepository.save(notification);
  }
}
