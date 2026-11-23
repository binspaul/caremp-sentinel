import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('admin')
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  firstName: string;

  @Column({ type: 'varchar', length: 255, nullable: true, default: '' })
  middleName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastName: string;

  @Column({ type: 'varchar', length: 2000, nullable: true, default: '' })
  description: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, nullable: false })
  emailAddress: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  secondaryEmailAddress: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, nullable: false })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  secondaryPhoneNumber: string;

  @Column({ type: 'varchar', length: 2000, nullable: true, default: null })
  avatar: string;

  @Index()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Index()
  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date | null;

  @Column({ type: 'integer', nullable: true })
  createdBy: number;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date | null;

  @Column({ type: 'integer', nullable: true })
  updatedBy: number;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Column({ type: 'integer', nullable: true })
  deletedBy: number;

  @Index()
  @Column({ type: 'integer', nullable: true })
  userId: number;

  // Relations
}
