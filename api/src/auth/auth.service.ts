import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dtos/login.dto';
import { UserDto } from './dtos/user.dto';
import { IAuthenticate, Role, RoleName } from './interfaces/role.interface';
import { User } from '../users/entities/user.entity';

import { AdminSignUpDto } from './dtos/admin-signup.dto';
import { Admin } from 'src/admins/entities/admin.entity';
import { ResidentSignUpDto } from './dtos/resident-signup.dto';
import { Resident } from 'src/residents/entities/resident.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) { }

  private async generateAccessToken(user: any) {
    return this.jwtService.signAsync(
      {
        id: user.id,
        role: user.roleId,
      },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_SECRET_EXPIRES as any,
      },
    );
  }

  private async generateRefreshToken(user: any) {
    return this.jwtService.signAsync(
      {
        id: user.id,
        role: user.roleId,
      },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES as any,
      },
    );
  }

  private async validateUser(
    manager: EntityManager,
    email: string,
    password: string,
  ) {
    const user = await manager.getRepository(User).findOne({
      where: { emailAddress: email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return user;
  }

  private async createAdmin(manager: EntityManager, user: User, dto: AdminSignUpDto) {
    const admin = manager.getRepository(Admin).create({
      firstName: dto.firstName,
      middleName: dto.middleName,
      lastName: dto.lastName,
      description: dto.description,
      emailAddress: dto.emailAddress,
      secondaryEmailAddress: dto.secondaryEmailAddress,
      phoneNumber: dto.phoneNumber,
      secondaryPhoneNumber: dto.secondaryPhoneNumber,
      avatar: dto.avatar,
      userId: user.id,
      createdBy: user.id,
    });

    return await manager.getRepository(Admin).save(admin);
  }

  private async createResident(manager: EntityManager, user: User, dto: ResidentSignUpDto) {
    const resident = manager.getRepository(Resident).create({
      uhid: crypto.randomUUID(),
      firstName: dto.firstName,
      middleName: dto.middleName,
      lastName: dto.lastName,
      description: dto.description,
      emailAddress: dto.emailAddress,
      secondaryEmailAddress: dto.secondaryEmailAddress,
      phoneNumber: dto.phoneNumber,
      secondaryPhoneNumber: dto.secondaryPhoneNumber,
      emergencyContactNumber: dto.emergencyContactNumber,
      gender: dto.gender,
      avatar: dto.avatar,
      userId: user.id,
      createdBy: user.id,
    });

    return await manager.getRepository(Resident).save(resident);
  }

  async adminSignUp(adminSignUpDto: AdminSignUpDto): Promise<IAuthenticate> {
    return this.dataSource.transaction(async (manager) => {
      const {
        firstName,
        middleName,
        lastName,
        description,
        emailAddress,
        secondaryEmailAddress,
        phoneNumber,
        secondaryPhoneNumber,
        password,
        avatar,
      } = adminSignUpDto;

      const normalizedEmail = emailAddress?.trim().toLowerCase();

      const existingUser = await manager.getRepository(User).findOne({
        where: [
          { emailAddress: normalizedEmail },
          { phoneNumber: phoneNumber },
        ],
      });

      if (existingUser?.emailAddress === normalizedEmail) {
        throw new ConflictException(
          'The specified email address is already in use.',
        );
      }

      if (existingUser?.phoneNumber === phoneNumber) {
        throw new ConflictException(
          'The specified phone number is already in use.',
        );
      }

      const normalizedSecondaryEmail = secondaryEmailAddress
        ?.trim()
        .toLowerCase();

      const hashedPassword = await bcrypt.hash(password, 10);
      const roleId = Role.ADMIN;
      const roleName = RoleName.ADMIN;

      const user = manager.getRepository(User).create({
        firstName,
        middleName,
        lastName,
        description,
        emailAddress: normalizedEmail,
        secondaryEmailAddress: normalizedSecondaryEmail,
        phoneNumber,
        secondaryPhoneNumber,
        password: hashedPassword,
        avatar,
        roleId,
        roleName,
        isActive: true,
        isVerified: true,
      });

      await manager.getRepository(User).save(user);

      const admin = await this.createAdmin(manager, user, adminSignUpDto);

      const accessToken = await this.generateAccessToken(user);
      const refreshToken = await this.generateRefreshToken(user);

      await manager
        .getRepository(User)
        .update(user.id, {});

      const safeUser = { ...user, personId: admin.id };

      delete (safeUser as any).password;

      const safeUserDto = plainToInstance(UserDto, safeUser, {
        excludeExtraneousValues: true,
      });

      return {
        token: accessToken,
        refreshToken,
        user: safeUserDto,
      };
    }).then(async (result) => {
      return result;
    });
  }

  async residentSignUp(residentSignUpDto: ResidentSignUpDto): Promise<IAuthenticate> {
    return this.dataSource.transaction(async (manager) => {
      const {
        firstName,
        middleName,
        lastName,
        description,
        emailAddress,
        secondaryEmailAddress,
        phoneNumber,
        secondaryPhoneNumber,
        password,
        gender,
        avatar,
      } = residentSignUpDto;

      const normalizedEmail = emailAddress?.trim().toLowerCase();

      const existingUser = await manager.getRepository(User).findOne({
        where: [
          { emailAddress: normalizedEmail },
          { phoneNumber: phoneNumber },
        ],
      });

      if (existingUser?.emailAddress === normalizedEmail) {
        throw new ConflictException(
          'The specified email address is already in use.',
        );
      }

      if (existingUser?.phoneNumber === phoneNumber) {
        throw new ConflictException(
          'The specified phone number is already in use.',
        );
      }

      const normalizedSecondaryEmail = secondaryEmailAddress
        ?.trim()
        .toLowerCase();

      const hashedPassword = await bcrypt.hash(password, 10);
      const roleId = Role.RESIDENT;
      const roleName = RoleName.RESIDENT;

      const user = manager.getRepository(User).create({
        firstName,
        middleName,
        lastName,
        description,
        emailAddress: normalizedEmail,
        secondaryEmailAddress: normalizedSecondaryEmail,
        phoneNumber,
        secondaryPhoneNumber,
        password: hashedPassword,
        gender,
        avatar,
        roleId,
        roleName,
        isActive: true,
        isVerified: true,
      });

      await manager.getRepository(User).save(user);

      const resident = await this.createResident(manager, user, residentSignUpDto);

      const accessToken = await this.generateAccessToken(user);
      const refreshToken = await this.generateRefreshToken(user);

      await manager
        .getRepository(User)
        .update(user.id, {});

      const safeUser = { ...user, personId: resident.id };

      delete (safeUser as any).password;

      const safeUserDto = plainToInstance(UserDto, safeUser, {
        excludeExtraneousValues: true,
      });

      return {
        token: accessToken,
        refreshToken,
        user: safeUserDto
      };
    }).then(async (result) => {
      return result;
    });
  }


  async login(loginDto: LoginDto): Promise<IAuthenticate> {
    return this.dataSource.transaction(async (manager) => {
      const { emailAddress, password } = loginDto;
      const normalizedEmail = emailAddress?.trim().toLowerCase();
      const user = await this.validateUser(manager, normalizedEmail, password);
      const accessToken = await this.generateAccessToken(user);
      const refreshToken = await this.generateRefreshToken(user);

      await manager
        .getRepository(User)
        .update(user.id, {});

      let personId: number | null = null;
      if (user.roleName === RoleName.ADMIN) {
        const admin = await manager.getRepository(Admin).findOne({ where: { userId: user.id } });
        if (admin) {
          personId = admin.id;
        }
      } else if (user.roleName === RoleName.RESIDENT) {
        const resident = await manager.getRepository(Resident).findOne({ where: { userId: user.id } });
        if (resident) {
          personId = resident.id;
        }
      }

      const safeUser = { ...user, personId };

      delete (safeUser as any).password;

      const safeUserDto = plainToInstance(UserDto, safeUser, {
        excludeExtraneousValues: true,
      });

      return {
        token: accessToken,
        refreshToken,
        user: safeUserDto,
      };
    });
  }

  async logout(userId: number, token: string): Promise<{ message: string }> {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager
        .getRepository(User)
        .findOne({ where: { id: userId } });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      await manager
        .getRepository(User)
        .update(userId, {});

      const decoded = this.jwtService.decode(token) as { exp: number };

      if (decoded?.exp) {
        const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
      }

      return { message: 'Logout successful' };
    });
  }
}
