import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum NotificationType {
  ALERT = 'alert',
  FALL = 'fall',
  VITAL_BREACH = 'vital_breach',
  GEOFENCE = 'geofence',
  DEVICE = 'device',
  SYSTEM = 'system',
}

export enum NotificationPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

@Entity('notification')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', nullable: true })
  @Index()
  userId: number;

  @Column({ type: 'integer', nullable: true })
  @Index()
  residentId: number;

  @Column({
    type: 'varchar',
    length: 50,
    default: NotificationType.ALERT,
  })
  @Index()
  type: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: NotificationPriority.MEDIUM,
  })
  @Index()
  priority: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  @Index()
  isRead: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date;

  @Column({ type: 'boolean', default: false })
  @Index()
  isDismissed: boolean;

  @Column({ type: 'boolean', default: false })
  @Index()
  isDeleted: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
