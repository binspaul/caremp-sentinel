import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ResidentSignUpDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsOptional()
  middleName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description: string;

  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @IsNotEmpty()
  emailAddress: string;

  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @IsOptional()
  secondaryEmailAddress?: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  secondaryPhoneNumber?: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  emergencyContactNumber: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  password: string;

  @IsNumber()
  @IsNotEmpty()
  gender: number;

  @IsOptional()
  @IsString()
  avatar?: string;
}
