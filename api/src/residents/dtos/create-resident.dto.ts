import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsInt,
  IsNumber,
  IsBoolean,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class CreateResidentDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  uhid?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  firstName: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  middleName?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  emailAddress: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  phoneNumber: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  emergencyContactNumber?: string;

  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(130)
  age?: number;

  @IsInt()
  @IsOptional()
  gender?: number; // 1: Male, 2: Female, 3: Other

  @IsInt()
  @IsOptional()
  bloodGroupId?: number; // 1: O+, 2: A+, 3: B+, 4: AB+, etc.

  @IsString()
  @IsOptional()
  @MaxLength(50)
  roomNumber?: string;

  @IsInt()
  @IsOptional()
  zoneId?: number; // Optional zone to assign the resident to

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  fallRiskScore?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  healthScore?: number;

  @IsBoolean()
  @IsOptional()
  hasFallHistory?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  specialNotes?: string;

  @IsNumber()
  @IsOptional()
  referenceHeartRate?: number;

  @IsNumber()
  @IsOptional()
  referenceHrv?: number;

  @IsNumber()
  @IsOptional()
  referenceSystolicBP?: number;

  @IsNumber()
  @IsOptional()
  referenceDiastolicBP?: number;

  @IsNumber()
  @IsOptional()
  referenceOxygenSaturation?: number;

  @IsNumber()
  @IsOptional()
  referenceBodyTemperature?: number;

  @IsNumber()
  @IsOptional()
  heightCm?: number;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsInt()
  @IsOptional()
  status?: number; // 1: Active, 0: Inactive

  @IsInt()
  @IsOptional()
  userId?: number;

  @IsInt()
  @IsOptional()
  createdBy?: number;
}
