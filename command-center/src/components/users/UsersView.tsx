import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import commandCenterService from '../../services/commandCenterService';
import { Badge } from '../common/Badge';
import { UserCheck, Search, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react';

interface UsersViewProps {
  lastUpdated?: Date;
}

export const UsersView: React.FC<UsersViewProps> = ({ lastUpdated }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await commandCenterService.getUsers({ skip: 0, limit: 100 });
      setUsers(res.data);
      setTotal(res.total);
    } catch (e) {
      console.error('Failed to load users', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [lastUpdated]);

  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstName} ${u.lastName || ''}`.toLowerCase();
    const email = (u.emailAddress || '').toLowerCase();
    const phone = (u.phoneNumber || '').toLowerCase();
    const query = search.toLowerCase();

    const matchesSearch = fullName.includes(query) || email.includes(query) || phone.includes(query);
    const matchesRole = roleFilter === 'all' || u.roleName?.toLowerCase() === roleFilter.toLowerCase();

    return matchesSearch && matchesRole;
  });

  const getRoleVariant = (roleName?: string): 'purple' | 'info' | 'normal' | 'neutral' => {
    const r = roleName?.toLowerCase();
    if (r === 'superadmin') return 'purple';
    if (r === 'admin') return 'info';
    if (r === 'resident') return 'normal';
    return 'neutral';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Users
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Accounts with administrative, clinician, or portal authorization. Total: {total}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative min-w-64">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user by name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500/60 shadow-sm dark:shadow-none"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-purple-500/60 shadow-sm dark:shadow-none cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="superadmin">Superadmin</option>
            <option value="admin">Admin</option>
            <option value="resident">Resident</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm dark:shadow-xl backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/40 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-6 font-semibold">User</th>
                <th className="py-3.5 px-4 font-semibold">Contact Email</th>
                <th className="py-3.5 px-4 font-semibold">Phone</th>
                <th className="py-3.5 px-4 font-semibold">Assigned Role</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-6 font-semibold text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-36 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                    <td className="py-4 px-6 text-right"><div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-6 text-center text-slate-400 dark:text-slate-500">
                    <UserCheck className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No users found</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {search ? `No user records match "${search}".` : 'No users currently registered.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* User */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-bold text-xs text-purple-600 dark:text-purple-400">
                          {u.firstName?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {u.firstName} {u.lastName || ''}
                          </p>
                          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-500">ID #{u.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-4 px-4 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{u.emailAddress}</span>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-4 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{u.phoneNumber || '--'}</span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-4">
                      <Badge variant={getRoleVariant(u.roleName)} size="sm">
                        {u.roleName?.toUpperCase() || 'USER'}
                      </Badge>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={u.isActive ? 'normal' : 'neutral'} size="sm">
                          {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                        {u.isVerified && (
                          <span title="Verified Account" className="text-emerald-500 dark:text-emerald-400">
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="py-4 px-6 text-right font-mono text-[11px] text-slate-500 dark:text-slate-500">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '--'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
