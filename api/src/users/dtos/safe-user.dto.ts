import { Expose } from 'class-transformer';

export class SafeUserDto {
  @Expose()
  id: number;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  emailAddress: string;

  @Expose()
  secondaryEmailAddress?: string;

  @Expose()
  phoneNumber?: string;

  @Expose()
  secondaryPhoneNumber?: string;

  @Expose()
  gender?: string;

  @Expose()
  avatar?: string;
}
