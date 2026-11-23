import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';

import { UpdateResidentDto } from './dtos/update-resident.dto';
import { Resident } from './entities/resident.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class ResidentsService {
  constructor(
    @InjectRepository(Resident)
    private readonly residentRepository: Repository<Resident>,
  ) { }

  async getCounters() {
    const counters = await this.residentRepository.find({});

    return counters;
  }

  async findAll(
    skip: number,
    limit: number,
  ) {
    try {
      const qb = this.residentRepository
        .createQueryBuilder('resident')
        .where('resident.isDeleted = :isDeleted', {
          isDeleted: false,
        });

      qb.addOrderBy('resident.id', 'DESC');

      const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

      return [data, total];
    } catch (error) {
      console.error('Error fetching vitals:', error);
    }
  }

  async findOne(id: number) {
    const resident = await this.residentRepository
      .createQueryBuilder('resident')
      .where('resident.id = :id', { id })
      .andWhere('resident.isDeleted = false')
      .getOne();

    if (!resident) {
      return null;
    }

    return resident;
  }

  async getResidentNamesList(
    search?: string,
  ) {
    const queryBuilder = this.residentRepository
      .createQueryBuilder('resident')
      .select([
        'resident.id',
        'resident.firstName',
        'resident.middleName',
        'resident.lastName',
      ])
      .where('resident.isDeleted = :isDeleted', { isDeleted: false });

    if (search) {
      queryBuilder.andWhere(
        '(resident.firstName ILIKE :search OR resident.middleName ILIKE :search OR resident.lastName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('resident.firstName', 'ASC');

    const residents = await queryBuilder.getMany();

    return residents.map((resident) => ({
      id: resident.id,
      fullName: [resident.firstName, resident.middleName, resident.lastName]
        .filter(Boolean)
        .join(' ')
        .trim(),
      firstName: resident.firstName,
      middleName: resident.middleName,
      lastName: resident.lastName,
    }));
  }

  async update(id: number, updateResidentDto: UpdateResidentDto) {
    const updatedResident = await this.residentRepository.manager.transaction(
      async (manager) => {
        const resident = await manager.findOne(Resident, {
          where: { id, isDeleted: false },
        });

        if (!resident) return null;

        const normalizedEmail = updateResidentDto.emailAddress
          ?.trim()
          .toLowerCase();
        const phoneNumber = updateResidentDto.phoneNumber;

        if (normalizedEmail || phoneNumber) {
          const conditions: any[] = [];
          if (normalizedEmail) {
            conditions.push({
              emailAddress: normalizedEmail,
              id: Not(resident.userId),
            });
          }
          if (phoneNumber) {
            conditions.push({
              phoneNumber: phoneNumber,
              id: Not(resident.userId),
            });
          }

          if (conditions.length > 0) {
            const existingUser = await manager.findOne(User, {
              where: conditions,
            });

            if (existingUser) {
              if (existingUser.emailAddress === normalizedEmail) {
                throw new ConflictException(
                  'The specified email address is already in use.',
                );
              }

              if (existingUser.phoneNumber === phoneNumber) {
                throw new ConflictException(
                  'The specified phone number is already in use.',
                );
              }
            }
          }
        }

        await manager.update(Resident, id, updateResidentDto);

        if (resident.userId) {
          const userUpdate: any = {};

          if (updateResidentDto.firstName !== undefined)
            userUpdate.firstName = updateResidentDto.firstName;

          if (updateResidentDto.middleName !== undefined)
            userUpdate.middleName = updateResidentDto.middleName;

          if (updateResidentDto.lastName !== undefined)
            userUpdate.lastName = updateResidentDto.lastName;

          if (updateResidentDto.gender !== undefined)
            userUpdate.gender = updateResidentDto.gender;

          if (updateResidentDto.description !== undefined)
            userUpdate.description = updateResidentDto.description;

          if (updateResidentDto.emailAddress !== undefined)
            userUpdate.emailAddress = updateResidentDto.emailAddress;

          if (updateResidentDto.phoneNumber !== undefined)
            userUpdate.phoneNumber = updateResidentDto.phoneNumber;

          if (Object.keys(userUpdate).length > 0) {
            await manager.update(User, resident.userId, userUpdate);
          }
        }

        return manager.findOneBy(Resident, { id });
      },
    );

    return updatedResident;
  }
}
