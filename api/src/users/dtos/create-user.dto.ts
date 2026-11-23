import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  role: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  emailAddress: string;

  @IsString()
  @IsEmail()
  secondaryEmailAddress: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  secondaryPhoneNumber: string;

  @IsString()
  roleName: string;

  @IsNumber()
  gender: number;

  @IsString()
  avatar: string;

  @IsBoolean()
  isVerified: boolean;

  @IsBoolean()
  isActive: boolean;

  @IsBoolean()
  isDeleted: boolean;

  createdBy: number;
  updatedBy: number;

  @IsNotEmpty()
  @IsNumber()
  companyId: number;

  @IsNotEmpty()
  @IsNumber()
  roleId: number;
}
