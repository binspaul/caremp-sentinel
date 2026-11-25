import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import commandCenterService from '../../services/commandCenterService';
import { Badge } from '../common/Badge';
import {
  UserCheck,
  Search,
  ShieldCheck,
  Mail,
  Phone,
  Users,
  UserX,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface UsersViewProps {
  lastUpdated?: Date;
}

export const UsersView: React.FC<UsersViewProps> = ({ lastUpdated }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Pagination state (default 15 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

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

  const activeCount = users.filter((u) => u.isActive).length;
  const inactiveCount = users.filter((u) => !u.isActive).length;
  const staffCount = users.filter((u) => u.roleName?.toLowerCase() !== 'resident').length;

  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstName} ${u.lastName || ''}`.toLowerCase();
    const email = (u.emailAddress || '').toLowerCase();
    const phone = (u.phoneNumber || '').toLowerCase();
    const query = search.toLowerCase();

    const matchesSearch = fullName.includes(query) || email.includes(query) || phone.includes(query);
    const matchesRole =
      roleFilter === 'all'
        ? true
        : roleFilter === 'staff'
        ? u.roleName?.toLowerCase() !== 'resident'
        : u.roleName?.toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? u.isActive
        : !u.isActive;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalFiltered = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getRoleVariant = (roleName?: string): 'purple' | 'info' | 'normal' | 'neutral' => {
    const r = roleName?.toLowerCase();
    if (r === 'superadmin') return 'purple';
    if (r === 'admin') return 'info';
    if (r === 'resident') return 'normal';
    return 'neutral';
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Tagline Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Users
          </h2>
        </div>
      </div>

      {/* Top Telemetry Summary Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Accounts */}
        <div
          onClick={() => {
            setStatusFilter('all');
            setRoleFilter('all');
            setCurrentPage(1);
          }}
          className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-3 ${
            statusFilter === 'all' && roleFilter === 'all'
              ? 'border-purple-500 ring-1 ring-purple-500/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Accounts</p>
            <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
              {users.length}
            </p>
          </div>
        </div>

        {/* Active Accounts */}
        <div
          onClick={() => {
            setStatusFilter('active');
            setRoleFilter('all');
            setCurrentPage(1);
          }}
          className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-3 ${
            statusFilter === 'active' && roleFilter === 'all'
              ? 'border-emerald-500 ring-1 ring-emerald-500/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Users</p>
            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {activeCount}
            </p>
          </div>
        </div>

        {/* Clinicians & Staff */}
        <div
          onClick={() => {
            setRoleFilter('staff');
            setStatusFilter('all');
            setCurrentPage(1);
          }}
          className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-3 ${
            roleFilter === 'staff'
              ? 'border-blue-500 ring-1 ring-blue-500/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Clinicians & Staff</p>
            <p className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
              {staffCount}
            </p>
          </div>
        </div>

        {/* Inactive Accounts */}
        <div
          onClick={() => {
            setStatusFilter('inactive');
            setRoleFilter('all');
            setCurrentPage(1);
          }}
          className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-3 ${
            statusFilter === 'inactive' && roleFilter === 'all'
              ? 'border-amber-500 ring-1 ring-amber-500/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Inactive / Suspended</p>
            <p className="text-xl font-bold font-mono text-slate-700 dark:text-slate-300">
              {inactiveCount}
            </p>
          </div>
        </div>
      </div>

      {/* Main Users Table & Controls Container */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Top Controls Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-500" />
              <span>Users</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {totalFiltered}
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-48 flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search name, email, phone..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl text-xs focus:outline-hidden focus:border-purple-500"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-purple-500 cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="staff">Clinicians & Staff</option>
              <option value="superadmin">Superadmin</option>
              <option value="admin">Admin</option>
              <option value="resident">Resident</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-purple-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Contact Email</th>
                  <th className="py-3 px-4 font-semibold">Phone</th>
                  <th className="py-3 px-4 font-semibold">Assigned Role</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3.5 px-4"><div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-36 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="py-3.5 px-4 text-right"><div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 px-4 text-center text-slate-400 dark:text-slate-500">
                      <UserCheck className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No users found</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        {search ? `No user records match "${search}".` : 'No users currently registered.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      {/* User */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-bold text-xs text-purple-600 dark:text-purple-400 shrink-0">
                            {u.firstName?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {u.firstName} {u.lastName || ''}
                            </p>
                            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">ID #{u.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span>{u.emailAddress}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span>{u.phoneNumber || '--'}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <Badge variant={getRoleVariant(u.roleName)} size="sm">
                          {u.roleName?.toUpperCase() || 'USER'}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '--'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Centered Pagination Footer */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/30 flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-8 text-xs font-sans text-center rounded-xl">
          {/* Summary & Page Size Selector */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-500 dark:text-slate-400">
            <span>
              Showing{' '}
              <strong className="text-slate-900 dark:text-white font-mono">
                {totalFiltered === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-900 dark:text-white font-mono">
                {Math.min(currentPage * pageSize, totalFiltered)}
              </strong>{' '}
              of <strong className="text-slate-900 dark:text-white font-mono">{totalFiltered}</strong> records
            </span>

            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer shadow-xs"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs flex items-center gap-1"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <div className="flex items-center gap-1 px-2">
              <span className="text-slate-600 dark:text-slate-400 font-mono">
                Page <strong className="text-slate-900 dark:text-white">{currentPage}</strong> of{' '}
                <strong className="text-slate-900 dark:text-white">{totalPages}</strong>
              </span>
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs flex items-center gap-1"
              title="Next Page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
