import {
  Length,
  IsString,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MaxLength,
} from 'class-validator';

export class CreateResidentDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  uhid: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  firstName: string;

  @IsOptional()
  @IsNotEmpty()
  middleName: string;

  @IsString()
  @Length(1, 255)
  lastName: string;

  @IsString()
  @Length(1, 255)
  nickName: string;

  @IsString()
  @Length(1, 2000)
  description?: string;

  @IsDateString()
  dateOfBirth: string;

  @IsInt()
  gender: number;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  emailAddress: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  emergencyContactNumber: string;

  @IsString()
  @Length(1, 2000)
  address: string;

  @IsInt()
  bloodGroupId: number;

  @IsString()
  @Length(1, 2000)
  notes: string;

  @IsString()
  @Length(1, 2000)
  specialNotes: string;

  @IsInt()
  @IsNotEmpty()
  createdBy: number;

  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsOptional()
  heightCm?: number;

  @IsInt()
  @IsOptional()
  heightUnit?: number;

  @IsOptional()
  weight?: number;

  @IsInt()
  @IsOptional()
  weightUnit?: number;
}
