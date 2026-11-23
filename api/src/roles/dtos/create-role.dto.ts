import { IsInt, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  name: string;

  @IsString()
  @Length(1, 2000)
  description: string;

  @IsInt()
  createdBy: number;
}
