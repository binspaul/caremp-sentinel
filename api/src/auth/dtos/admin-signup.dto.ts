import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AdminSignUpDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsOptional()
  @IsNotEmpty()
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

  @IsOptional()
  @IsEmail()
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
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  password: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
