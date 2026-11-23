import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) { }

  async create(createRoleDto: CreateRoleDto) {
    return await this.roleRepository.manager.transaction(async (manager) => {
      const savedRole = manager.create(Role, createRoleDto);

      return await manager.save(savedRole);
    });
  }

  async findAll(
    skip: number,
    limit: number,
    includeDeleted: boolean,
    sortBy?: string,
    sortOrder?: number,
  ) {
    let whereCondition: Record<string, any> = {};
    if (includeDeleted === true) {
      whereCondition = { isDeleted: true };
    } else {
      whereCondition = { isDeleted: false };
    }

    let orderBy: Record<string, 'ASC' | 'DESC'> = { id: 'ASC' };

    if (sortBy) {
      const sortDirection = sortOrder === -1 ? 'DESC' : 'ASC';
      orderBy = { [sortBy]: sortDirection };
    }

    const [data, total] = await this.roleRepository.findAndCount({
      where: whereCondition,
      skip,
      take: limit,
      order: orderBy,
    });

    return [data, total];
  }

  async findOne(id: number) {
    const role = await this.roleRepository.findOne({
      where: { id, isDeleted: false },
    });

    return role;
  }

  async findByName(name: string) {
    const role = await this.roleRepository.findOne({ where: { name } });

    return role;
  }

  async getCounters() {
    const counters = await this.roleRepository.find({});

    return counters;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    return await this.roleRepository.manager.transaction(async (manager) => {
      const role = await manager.findOne(Role, {
        where: { id, isDeleted: false },
      });

      if (!role) return null;

      await manager.update(Role, id, updateRoleDto);

      return manager.findOneBy(Role, { id });
    });
  }
}
