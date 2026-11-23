import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
    UpdateDateColumn,
} from 'typeorm';

import { Resident } from 'src/residents/entities/resident.entity';

@Entity('short_term_memory')
export class ShortTermMemory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text' })
    memoryText: string;

    @Column({ type: 'timestamp' })
    expiresAt: Date;

    @Column({ type: 'boolean', default: false })
    isExpired?: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ type: 'integer', nullable: true })
    createdBy: number;

    @UpdateDateColumn()
    updatedAt: Date | null;

    @Column({ type: 'integer', nullable: true })
    updatedBy: number;

    @Index()
    @Column()
    residentId: number;

    // Relations
    @ManyToOne(() => Resident, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'residentId' })
    resident: Resident;
}
