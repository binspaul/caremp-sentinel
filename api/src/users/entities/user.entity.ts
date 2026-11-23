import {
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';

export enum Title {
  MR = 1,
  MRS = 2,
  MS = 3,
  DR = 4,
}

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  firstName: string;

  @Column({ type: 'varchar', length: 255, nullable: true, default: '' })
  middleName: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  lastName: string;

  @Column({ type: 'varchar', length: 2000, nullable: true, default: '' })
  description: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

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

  @Column({ type: 'varchar', length: 50, default: 'user' })
  roleName: string;

  @Column({ type: 'integer', nullable: true })
  gender: number;

  @Column({ type: 'varchar', length: 2000, nullable: true, default: null })
  avatar: string;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isOnline: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastOnlineAt: Date | null;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'integer', default: Title.MR })
  title: Title;

  @Column({ type: 'varchar', length: 2000, nullable: true, default: '' })
  address1: string;

  @Column({ type: 'varchar', length: 2000, nullable: true, default: '' })
  address2: string;

  @Column({ type: 'varchar', length: 2000, nullable: true, default: '' })
  address3: string;

  @Column({ type: 'varchar', length: 255, nullable: true, default: '' })
  street: string;

  @Column({ type: 'varchar', length: 255, nullable: true, default: '' })
  city: string;

  @Column({ type: 'varchar', length: 255, nullable: true, default: '' })
  state: string;

  @Column({ type: 'integer', nullable: false, default: 1 })
  countryId: number;

  @Column({ type: 'varchar', length: 50, nullable: true, default: '' })
  zipCode: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'integer', default: 1 })
  createdBy: number;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ type: 'integer', nullable: true, default: null })
  updatedBy: number;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Column({ type: 'integer', nullable: true })
  deletedBy: number;

  @Column({ type: 'integer', default: 1 })
  roleId: number;

  // Relations
}
