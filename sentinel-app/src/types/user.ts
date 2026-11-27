export interface User {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  emailAddress: string;
  phoneNumber?: string;
  gender?: number;
  avatar?: string | null;
  roleName?: string;
  personId?: number | null;
}