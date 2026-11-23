import { DataSource } from 'typeorm';
import { RoleName } from '../auth/interfaces/role.interface';
import { Role as RoleEntity } from '../roles/entities/role.entity';

const roles: Partial<RoleEntity>[] = [
    {
        name: RoleName.SUPERADMIN,
        description: 'Super administrator with full system access',
        isSystemRole: true,
        isActive: true,
    },
    {
        name: RoleName.ADMIN,
        description: 'Administrator with full access within an organization',
        isSystemRole: true,
        isActive: true,
    },
];

export async function seedRoles(dataSource: DataSource) {
    const repo = dataSource.getRepository(RoleEntity);

    for (const role of roles) {
        const exists = await repo.findOne({
            where: { name: role.name },
        });

        if (!exists) {
            const entity = repo.create(role);

            await repo.save(entity);

            console.log(`Added role: ${role.name}`);
        } else {
            console.log(`Role already exists: ${role.name}`);
        }
    }

    console.log('Roles seeded successfully.');
}