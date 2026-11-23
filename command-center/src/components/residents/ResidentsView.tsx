import React, { useState, useEffect } from 'react';
import { Resident } from '../../types';
import commandCenterService from '../../services/commandCenterService';
import { ResidentProfileDrawer } from './ResidentProfileDrawer';
import {
  Users,
  Search,
  Phone,
  Mail,
  Activity,
  AlertCircle,
  Eye,
  User,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldAlert,
} from 'lucide-react';

interface ResidentsViewProps {
  onSelectResidentVitals: (residentId: number) => void;
  lastUpdated?: Date;
}

export const ResidentsView: React.FC<ResidentsViewProps> = ({
  onSelectResidentVitals,
  lastUpdated,
}) => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'high_risk'>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');

  // Pagination state (default 15 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // State for Sliding Profile Drawer
  const [selectedResidentForProfile, setSelectedResidentForProfile] = useState<Resident | null>(null);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  const loadResidents = async () => {
    setIsLoading(true);
    try {
      const res = await commandCenterService.getResidents({ skip: 0, limit: 100 });
      setResidents(res.data);
      setTotal(res.total);
    } catch (e) {
      console.error('Failed to load residents', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResidents();
  }, [lastUpdated]);

  const handleOpenProfile = (resident: Resident) => {
    setSelectedResidentForProfile(resident);
    setIsProfileDrawerOpen(true);
  };

  const handleCloseProfile = () => {
    setIsProfileDrawerOpen(false);
  };

  const activeCount = residents.filter((r) => r.status === 1).length;
  const inactiveCount = residents.filter((r) => r.status !== 1).length;
  const highRiskCount = residents.filter((r) => (r.fallRiskScore ?? 0) >= 60 || r.hasFallHistory).length;

  const filteredResidents = residents.filter((r) => {
    const fullName = `${r.firstName} ${r.lastName}`.toLowerCase();
    const uhid = (r.uhid || '').toLowerCase();
    const email = (r.emailAddress || '').toLowerCase();
    const query = search.toLowerCase();

    const matchesSearch = fullName.includes(query) || uhid.includes(query) || email.includes(query);

    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = r.status === 1;
    else if (statusFilter === 'inactive') matchesStatus = r.status !== 1;
    else if (statusFilter === 'high_risk') matchesStatus = (r.fallRiskScore ?? 0) >= 60 || Boolean(r.hasFallHistory);

    let matchesGender = true;
    if (genderFilter === 'male') matchesGender = r.gender === 1;
    else if (genderFilter === 'female') matchesGender = r.gender === 2;

    return matchesSearch && matchesStatus && matchesGender;
  });

  const totalFiltered = filteredResidents.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const paginatedResidents = filteredResidents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Page Title & Tagline Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
            Residents
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Care recipient registry, continuous telemetry enrollment, demographic baselines, and clinical risk profiles
          </p>
        </div>
      </div>

      {/* Top Telemetry Summary Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => {
            setStatusFilter('all');
            setCurrentPage(1);
          }}
          className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-3 ${
            statusFilter === 'all'
              ? 'border-emerald-500 ring-1 ring-emerald-500/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Enrolled</p>
            <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
              {residents.length}
            </p>
          </div>
        </div>

        <div
          onClick={() => {
            setStatusFilter('active');
            setCurrentPage(1);
          }}
          className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-3 ${
            statusFilter === 'active'
              ? 'border-teal-500 ring-1 ring-teal-500/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Telemetry</p>
            <p className="text-xl font-bold font-mono text-teal-600 dark:text-teal-400">
              {activeCount}
            </p>
          </div>
        </div>

        <div
          onClick={() => {
            setStatusFilter('high_risk');
            setCurrentPage(1);
          }}
          className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-3 ${
            statusFilter === 'high_risk'
              ? 'border-rose-500 ring-1 ring-rose-500/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">High Risk / Fall Prone</p>
            <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {highRiskCount}
            </p>
          </div>
        </div>

        <div
          onClick={() => {
            setStatusFilter('inactive');
            setCurrentPage(1);
          }}
          className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-3 ${
            statusFilter === 'inactive'
              ? 'border-amber-500 ring-1 ring-amber-500/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Discharged / Inactive</p>
            <p className="text-xl font-bold font-mono text-slate-700 dark:text-slate-300">
              {inactiveCount}
            </p>
          </div>
        </div>
      </div>

      {/* Main Residents Table & Controls Container */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Top Controls Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              <span>Residents</span>
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
                placeholder="Search name, UHID, email..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="high_risk">High Risk Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {/* Gender Filter */}
            <select
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        {/* Residents Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Resident & UHID</th>
                  <th className="px-4 py-3">Demographics</th>
                  <th className="px-4 py-3">Contact Information</th>
                  <th className="px-4 py-3">Reference Baselines</th>
                  <th className="px-4 py-3">Operational Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3"><div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="px-4 py-3 text-right"><div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredResidents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 font-sans">
                      <AlertCircle className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No residents found</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        {search ? `No residents match "${search}".` : 'No resident records enrolled.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedResidents.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                    >
                      {/* Resident & UHID */}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleOpenProfile(r)}
                          className="flex items-center gap-2.5 text-left cursor-pointer focus:outline-hidden group/name"
                          title="Click to view resident profile"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 group-hover/name:bg-emerald-500 group-hover/name:text-white transition-colors">
                            {r.firstName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover/name:text-emerald-600 dark:group-hover/name:text-emerald-400 transition-colors flex items-center gap-1">
                              <span>{r.firstName} {r.middleName ? `${r.middleName} ` : ''}{r.lastName}</span>
                              <User className="w-3 h-3 opacity-0 group-hover/name:opacity-100 transition-opacity text-emerald-500" />
                            </p>
                            <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                              UHID: {r.uhid}
                            </p>
                          </div>
                        </button>
                      </td>

                      {/* Demographics */}
                      <td className="px-4 py-3">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">
                          {r.age ? `${r.age} yrs` : 'Age N/A'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {r.gender === 1 ? 'Male' : r.gender === 2 ? 'Female' : 'Other'}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-[11px]">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-44">{r.emailAddress}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5 font-mono">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{r.phoneNumber || r.emergencyContactNumber || '--'}</span>
                        </div>
                      </td>

                      {/* Baselines */}
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                          <span>HR: {r.referenceHeartRate || 75} bpm</span>
                          <span>BP: {r.referenceSystolicBP || 120}/{r.referenceDiastolicBP || 80}</span>
                          <span>SpO2: {r.referenceOxygenSaturation || 98}%</span>
                          <span>Temp: {r.referenceBodyTemperature || 36.8}°C</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {r.status === 1 ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active Monitoring
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 text-[11px]">
                            Discharged
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenProfile(r)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg transition cursor-pointer"
                            title="View Full Profile Drawer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectResidentVitals(r.id)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-cyan-600 dark:text-cyan-400 rounded-lg transition cursor-pointer"
                            title="Jump to Telemetry Stream"
                          >
                            <Activity className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/30 flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-8 text-xs font-sans text-center">
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
                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-emerald-500 cursor-pointer shadow-xs"
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
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs flex items-center gap-1"
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
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs flex items-center gap-1"
              title="Next Page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sliding Resident Profile Drawer */}
      <ResidentProfileDrawer
        resident={selectedResidentForProfile}
        isOpen={isProfileDrawerOpen}
        onClose={handleCloseProfile}
        onViewVitals={onSelectResidentVitals}
      />
    </div>
  );
};
