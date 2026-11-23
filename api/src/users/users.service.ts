import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { User } from './entities/user.entity';
import { UserCountersView } from './entities/user-counters.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(UserCountersView)
    private userCountersRepository: Repository<UserCountersView>,
  ) { }

  async create(createUserDto: CreateUserDto) {
    return await this.userRepository.manager.transaction(async (manager) => {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const savedUser = manager.create(User, createUserDto);

      savedUser.password = hashedPassword;

      return await manager.save(savedUser);
    });
  }

  async existingEmail(emailAddress: string) {
    const normalizedEmail = emailAddress?.trim().toLowerCase();

    const existingUser = await this.userRepository.findOne({
      where: [{ emailAddress: normalizedEmail }],
    });

    if (existingUser?.emailAddress === normalizedEmail) return existingUser;
  }

  async existingPhoneNumber(phoneNumber: string) {
    const normalizedPhoneNumber = phoneNumber?.trim().toLowerCase();

    const existingUser = await this.userRepository.findOne({
      where: [{ phoneNumber: normalizedPhoneNumber }],
    });

    if (existingUser?.phoneNumber === normalizedPhoneNumber) return existingUser;
  }

  async findAll(
    skip: number,
    limit: number,
    includeDeleted: boolean,
    search?: string,
    roleId?: number,
    sortBy?: string,
    sortOrder?: number,
  ) {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    queryBuilder
      .where('user.isDeleted = :isDeleted', { isDeleted: includeDeleted });

    if (roleId !== undefined && roleId !== null) {
      queryBuilder.andWhere('user.roleId = :roleId', { roleId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.middleName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const allowedSortFields = ['id', 'firstName', 'lastName'];

    const safeSortBy = allowedSortFields.includes(sortBy || '') ? sortBy : 'id';
    const order = sortOrder === -1 ? 'DESC' : 'ASC';

    const [data, total] = await queryBuilder
      .orderBy(`user.${safeSortBy}`, order)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return [data, total];
  }

  async findAllExceptSuperadmin(
    skip: number,
    limit: number,
    includeDeleted: boolean,
    search?: string,
    roleId?: number,
    sortBy?: string,
    sortOrder?: number,
  ) {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    queryBuilder
      .where('user.isDeleted = :isDeleted', { isDeleted: includeDeleted })
      .andWhere('user.roleId != :superAdminRoleId', { superAdminRoleId: 1 });

    if (roleId !== undefined && roleId !== null && roleId !== 1) {
      queryBuilder.andWhere('user.roleId = :roleId', { roleId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.middleName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const allowedSortFields = ['id', 'firstName', 'lastName'];

    const safeSortBy = allowedSortFields.includes(sortBy || '') ? sortBy : 'id';
    const order = sortOrder === -1 ? 'DESC' : 'ASC';

    const [data, total] = await queryBuilder
      .orderBy(`user.${safeSortBy}`, order)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return [data, total];
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id, isDeleted: false },
    });

    return user;
  }

  async counters() {
    const counters = await this.userCountersRepository.find();

    return counters[0];
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ) {
    return this.userRepository.manager
      .transaction(async (manager) => {
        const user = await manager.findOne(User, {
          where: { id, isDeleted: false },
        });

        if (!user) return null;

        await manager.update(User, id, updateUserDto);

        return manager.findOneBy(User, { id });
      })
      .then(async (result) => {
        return result;
      });
  }
}
