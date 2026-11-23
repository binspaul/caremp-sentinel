import {
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    Index,
} from 'typeorm';

@Entity('role')
export class Role {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column({ type: 'varchar', length: 100, nullable: false })
    name: string;

    @Column({ type: 'varchar', length: 2000, nullable: true, default: '' })
    description: string;

    @Column({ type: 'boolean', default: false })
    isSystemRole: boolean;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

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

    //Relations
}
