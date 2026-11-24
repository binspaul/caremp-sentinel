import { ConflictException, Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { CreateResidentDto } from './dtos/create-resident.dto';
import { UpdateResidentDto } from './dtos/update-resident.dto';
import { Resident, SleepStatus, HeightUnit, WeightUnit } from './entities/resident.entity';
import { User } from 'src/users/entities/user.entity';
import { Vital, Status as VitalStatus, Priority as VitalPriority, TemperatureUnit as VitalTempUnit } from 'src/vitals/entities/vital.entity';
import { RoomZone } from 'src/facility/entities/room-zone.entity';

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

  async create(dto: CreateResidentDto, currentUserId?: number): Promise<Resident> {
    return await this.residentRepository.manager.transaction(async (manager) => {
      const normalizedEmail = dto.emailAddress.trim().toLowerCase();
      const phoneNumber = dto.phoneNumber.trim();

      // 1. Check if resident with same email or phone already exists
      const existingResident = await manager.findOne(Resident, {
        where: [
          { emailAddress: normalizedEmail, isDeleted: false },
          { phoneNumber: phoneNumber, isDeleted: false },
        ],
      });
      if (existingResident) {
        if (existingResident.emailAddress === normalizedEmail) {
          throw new ConflictException('A resident with this email address already exists.');
        }
        if (existingResident.phoneNumber === phoneNumber) {
          throw new ConflictException('A resident with this phone number already exists.');
        }
      }

      // 2. Link or create User account
      let userId = dto.userId;
      if (!userId) {
        let user = await manager.findOne(User, {
          where: [
            { emailAddress: normalizedEmail },
            { phoneNumber: phoneNumber },
          ],
        });

        if (!user) {
          const defaultPassword = await bcrypt.hash('resident@123#', 10);
          user = manager.create(User, {
            firstName: dto.firstName.trim(),
            middleName: dto.middleName?.trim() || '',
            lastName: dto.lastName.trim(),
            description: dto.description?.trim() || 'Resident account',
            emailAddress: normalizedEmail,
            phoneNumber: phoneNumber,
            password: defaultPassword,
            roleName: 'resident',
            gender: dto.gender || 1,
            isVerified: true,
            isActive: true,
            isDeleted: false,
            countryId: 1,
          });
          user = await manager.save(User, user);
        }
        userId = user.id;
      }

      // 3. Generate unique UHID if not provided
      let uhid = dto.uhid?.trim();
      if (!uhid) {
        const count = await manager.count(Resident);
        uhid = `RES-${String(count + 1).padStart(3, '0')}`;
        const uhidExists = await manager.findOne(Resident, { where: { uhid } });
        if (uhidExists) {
          uhid = `RES-${Date.now().toString().slice(-4)}`;
        }
      }

      // 4. Calculate age if DOB provided
      let age = dto.age;
      if (age === undefined || age === null) {
        if (dto.dateOfBirth) {
          const dob = new Date(dto.dateOfBirth);
          const diff = Date.now() - dob.getTime();
          age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
        } else {
          age = 70;
        }
      }

      // 5. Create Resident entity
      const resident = manager.create(Resident, {
        uhid,
        firstName: dto.firstName.trim(),
        middleName: dto.middleName?.trim() || '',
        lastName: dto.lastName.trim(),
        description: dto.description?.trim() || '',
        emailAddress: normalizedEmail,
        phoneNumber: phoneNumber,
        emergencyContactNumber: dto.emergencyContactNumber?.trim() || phoneNumber,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        age: Number(age) || 0,
        gender: dto.gender ?? 1,
        bloodGroupId: dto.bloodGroupId ?? 1,
        address: dto.address?.trim() || '',
        notes: dto.notes?.trim() || '',
        specialNotes: dto.specialNotes?.trim() || '',
        status: dto.status ?? 1,
        fallRiskScore: dto.fallRiskScore ?? 25,
        hasFallHistory: dto.hasFallHistory ?? false,
        roomNumber: dto.roomNumber?.trim() || null,
        referenceHeartRate: dto.referenceHeartRate ?? 75.0,
        heartRateTolerance: 15.0,
        referenceHrv: dto.referenceHrv ?? 45.0,
        hrvTolerance: 15.0,
        referenceSystolicBP: dto.referenceSystolicBP ?? 120,
        systolicBPTolerance: 15.0,
        referenceDiastolicBP: dto.referenceDiastolicBP ?? 80,
        diastolicBPTolerance: 10.0,
        referenceOxygenSaturation: dto.referenceOxygenSaturation ?? 98.0,
        oxygenSaturationTolerance: 3.0,
        referenceBodyTemperature: dto.referenceBodyTemperature ?? 36.8,
        temperatureToleranceCelsius: 1.0,
        heightCm: dto.heightCm ?? 170.0,
        heightUnit: HeightUnit.CM,
        weight: dto.weight ?? 70.0,
        weightUnit: WeightUnit.KG,
        referenceSleepStatus: SleepStatus.AWAKE,
        referenceDeepSleep: 60,
        referenceLightSleep: 260,
        referenceRemSleep: 90,
        isActive: true,
        isDeleted: false,
        userId: userId,
        createdBy: currentUserId || userId,
      });

      const savedResident = await manager.save(Resident, resident);

      // 6. Assign to RoomZone if zoneId or roomNumber is provided
      try {
        if (dto.zoneId) {
          await manager.update(RoomZone, { currentResidentId: savedResident.id }, { currentResidentId: null });
          await manager.update(RoomZone, dto.zoneId, { currentResidentId: savedResident.id });
        } else if (dto.roomNumber) {
          const matchingZone = await manager.findOne(RoomZone, {
            where: { roomNumber: dto.roomNumber.trim() },
          });
          if (matchingZone) {
            matchingZone.currentResidentId = savedResident.id;
            await manager.save(RoomZone, matchingZone);
          }
        }
      } catch (zoneErr: any) {
        console.warn('Could not assign room zone for resident:', zoneErr?.message);
      }

      // 7. Create initial baseline Vital telemetry record
      try {
        const initialVital = manager.create(Vital, {
          residentId: savedResident.id,
          heartRate: savedResident.referenceHeartRate,
          hrv: savedResident.referenceHrv,
          systolicBP: savedResident.referenceSystolicBP,
          diastolicBP: savedResident.referenceDiastolicBP,
          oxygenSaturation: savedResident.referenceOxygenSaturation,
          bodyTemperature: savedResident.referenceBodyTemperature,
          batteryLevel: 98,
          temperatureUnit: VitalTempUnit.CELSIUS,
          status: VitalStatus.PROCESSED,
          priority: VitalPriority.NORMAL,
          payload: {
            activity: 'Resting / Admission Baseline',
            note: 'Initial clinical baseline record upon enrollment',
          },
        });
        await manager.save(Vital, initialVital);
      } catch (vitalErr: any) {
        console.warn('Could not create initial baseline vital for resident:', vitalErr?.message);
      }

      return savedResident;
    });
  }
}
