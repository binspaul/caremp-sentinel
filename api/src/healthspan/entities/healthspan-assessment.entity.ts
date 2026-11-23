import {
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Resident } from '../../residents/entities/resident.entity';

export enum FrailtyClassification {
  ROBUST = 'ROBUST',
  PRE_FRAIL = 'PRE_FRAIL',
  FRAIL = 'FRAIL',
}

@Index(['residentId', 'generatedAt'])
@Entity('healthspan_assessment')
export class HealthspanAssessment {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'integer', nullable: false })
  residentId: number;

  @Index()
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  generatedAt: Date;

  @Column({ type: 'integer', default: 72 })
  chronologicalAge: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 1,
    default: 72.0,
  })
  biologicalAge: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 1,
    default: 0.0,
  })
  biologicalAgeDelta: number; // e.g. +3.8 (older) or -2.4 (rejuvenated/younger)

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 3,
    default: 0.12,
  })
  frailtyIndex: number; // Rockwood 36-deficit e-FI index (0.000 - 1.000)

  @Column({
    type: 'varchar',
    length: 50,
    default: FrailtyClassification.ROBUST,
  })
  classification: FrailtyClassification;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'LOW',
  })
  sarcopeniaRisk: string; // LOW | MODERATE | HIGH

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 80.0,
  })
  mobilityCadenceScore: number; // 0 - 100 locomotion velocity & stability

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 75.0,
  })
  autonomicResilience: number; // 0 - 100 parasympathetic recovery tone

  @Column({ type: 'jsonb', default: () => "'[]'" })
  contributingDeficits: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  longevityInterventions: string[];

  @Column({
    type: 'varchar',
    length: 50,
    default: 'baseline',
  })
  protocolPhase: string; // baseline | active_intervention | optimized

  @Column({
    type: 'varchar',
    length: 100,
    default: 'rockwood-clock',
  })
  source: string;

  @Index()
  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Relation
  @ManyToOne(() => Resident, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'residentId' })
  resident: Resident;
}
