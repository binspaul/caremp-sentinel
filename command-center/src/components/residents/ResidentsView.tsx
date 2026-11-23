import React, { useState, useEffect } from 'react';
import { Resident } from '../../types';
import commandCenterService from '../../services/commandCenterService';
import { Badge } from '../common/Badge';
import { ResidentProfileDrawer } from './ResidentProfileDrawer';
import {
  Users,
  Search,
  Filter,
  Phone,
  Mail,
  Heart,
  Activity,
  Calendar,
  AlertCircle,
  Eye,
  User,
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active'>('all');

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

  const filteredResidents = residents.filter((r) => {
    const fullName = `${r.firstName} ${r.lastName}`.toLowerCase();
    const uhid = (r.uhid || '').toLowerCase();
    const email = (r.emailAddress || '').toLowerCase();
    const query = search.toLowerCase();

    const matchesSearch = fullName.includes(query) || uhid.includes(query) || email.includes(query);
    const matchesStatus = statusFilter === 'all' || r.status === 1;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
            Residents
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Care recipients enrolled in continuous digital twin monitoring. Total: {total}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative min-w-64">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, UHID, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 shadow-sm dark:shadow-none"
            />
          </div>

          {/* Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500/60 shadow-sm dark:shadow-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
          </select>
        </div>
      </div>

      {/* Residents Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm dark:shadow-xl backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/40 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-6 font-semibold">UHID & Name</th>
                <th className="py-3.5 px-4 font-semibold">Demographics</th>
                <th className="py-3.5 px-4 font-semibold">Contact & Emergency</th>
                <th className="py-3.5 px-4 font-semibold">Reference Baselines</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                    <td className="py-4 px-6 text-right"><div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filteredResidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-6 text-center text-slate-400 dark:text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No residents found</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {search ? `No residents match "${search}".` : 'No resident records enrolled.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredResidents.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                    {/* UHID & Name (Clickable to open profile drawer) */}
                    <td className="py-4 px-6">
                      <button
                        type="button"
                        onClick={() => handleOpenProfile(r)}
                        className="flex items-center gap-3 text-left cursor-pointer focus:outline-none group/name"
                        title="Click to view resident profile"
                      >
                        <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-xs text-emerald-600 dark:text-emerald-400 group-hover/name:bg-emerald-500 group-hover/name:text-white transition-colors">
                          {r.firstName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover/name:text-emerald-600 dark:group-hover/name:text-emerald-400 transition-colors flex items-center gap-1.5">
                            <span>{r.firstName} {r.middleName ? `${r.middleName} ` : ''}{r.lastName}</span>
                            <User className="w-3 h-3 opacity-0 group-hover/name:opacity-100 transition-opacity text-emerald-500" />
                          </p>
                          <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                            UHID: {r.uhid}
                          </p>
                        </div>
                      </button>
                    </td>

                    {/* Demographics */}
                    <td className="py-4 px-4">
                      <div className="text-slate-700 dark:text-slate-300">
                        {r.age ? `${r.age} yrs` : 'Age N/A'}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        {r.gender === 1 ? 'Male' : r.gender === 2 ? 'Female' : 'Other'}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-[11px]">
                        <Mail className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate max-w-44">{r.emailAddress}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mt-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span>{r.phoneNumber || r.emergencyContactNumber || '--'}</span>
                      </div>
                    </td>

                    {/* Baselines */}
                    <td className="py-4 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                        <span>HR: {r.referenceHeartRate || 75} bpm</span>
                        <span>BP: {r.referenceSystolicBP || 120}/{r.referenceDiastolicBP || 80}</span>
                        <span>SpO2: {r.referenceOxygenSaturation || 98}%</span>
                        <span>Temp: {r.referenceBodyTemperature || 36.8}°C</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <Badge variant={r.status === 1 ? 'normal' : 'neutral'} size="sm">
                        {r.status === 1 ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenProfile(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition cursor-pointer"
                          title="View Profile Sidebar"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>Profile</span>
                        </button>
                        <button
                          onClick={() => onSelectResidentVitals(r.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-transparent text-xs font-semibold transition cursor-pointer"
                          title="View Telemetry Vitals"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Vitals</span>
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
