import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({ name: 'user_counters' })
export class UserCountersView {
  @ViewColumn()
  users: number;

  @ViewColumn()
  activeUsers: number;

  @ViewColumn()
  inActiveUsers: number;

  @ViewColumn()
  superAdmins: number;

  @ViewColumn()
  admins: number;

  @ViewColumn()
  residents: number;
}
