import {
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Index,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Resident } from '../../residents/entities/resident.entity';

export enum GeneticRiskTier {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  ELEVATED = 'ELEVATED',
  HIGH = 'HIGH',
}

export interface PolygenicRiskScoreData {
  condition: string;
  percentile: number;
  riskLevel: 'LOW' | 'AVERAGE' | 'MODERATE' | 'ELEVATED' | 'HIGH';
  oddsRatio: number;
  snpsEvaluated: number;
  clinicalTarget: string;
  phenoCalibrations?: Record<string, any>;
}

export interface PharmacogenomicVariantData {
  gene: string;
  diplotype: string;
  phenotype: string; // e.g. NORMAL, INTERMEDIATE, POOR, RAPID, DECREASED
}

export interface DrugGeneAlertData {
  id: string;
  medication: string;
  gene: string;
  diplotype: string;
  phenotype: string;
  severity: 'HIGH_RISK' | 'WARNING' | 'ADVISORY';
  cpicLevel: 'A' | 'B';
  mechanism: string;
  clinicalRecommendation: string;
  alternativeOptions: string[];
  isReconciled: boolean;
  reconciledMedication?: string | null;
  reconciledBy?: string | null;
  reconciledAt?: string | null;
}

@Entity('genomic_profile')
export class GenomicProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'integer', nullable: false })
  residentId: number;

  @Column({
    type: 'varchar',
    length: 50,
    default: GeneticRiskTier.MODERATE,
  })
  overallRiskTier: GeneticRiskTier;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  prsScores: PolygenicRiskScoreData[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  variants: PharmacogenomicVariantData[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  activeMedications: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  activePgxAlerts: DrugGeneAlertData[];

  @Column({ type: 'jsonb', default: () => "'{}'" })
  phenoCalibrations: Record<string, any>;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  sequencingMeta: Record<string, any>;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  lastAssessedAt: Date;

  @Index()
  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Relation
  @OneToOne(() => Resident, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'residentId' })
  resident: Resident;
}
