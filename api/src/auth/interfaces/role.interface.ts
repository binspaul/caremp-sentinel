import { UserDto } from '../dtos/user.dto';

export enum Role {
  SUPERADMIN = 1,
  ADMIN = 2,
  RESIDENT = 3,
}

export enum RoleName {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  RESIDENT = 'resident',
}

export interface IAuthenticate {
  readonly user: UserDto;
  readonly token: string;
  readonly refreshToken: string;
}
