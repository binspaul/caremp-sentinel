import { Expose } from 'class-transformer';
import { RoleName } from '../interfaces/role.interface';

export class UserDto {
  @Expose()
  id: number;

  @Expose()
  firstName: string;

  @Expose()
  middleName: string;

  @Expose()
  lastName: string;

  @Expose()
  emailAddress: string;

  @Expose()
  phoneNumber?: string;

  @Expose()
  gender?: string;

  @Expose()
  avatar?: string;

  @Expose()
  roleName: RoleName;

  @Expose()
  personId: number;
}
