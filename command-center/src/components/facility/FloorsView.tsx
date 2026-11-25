import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Edit2,
  Trash2,
  MapPin,
  DoorOpen,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { Floor } from '../../types';
import commandCenterService from '../../services/commandCenterService';

interface FloorsViewProps {
  lastUpdated?: Date;
  onNavigateToMap?: () => void;
  onNavigateToRooms?: (floorId?: number) => void;
}

export const FloorsView: React.FC<FloorsViewProps> = ({
  lastUpdated,
  onNavigateToMap,
  onNavigateToRooms,
}) => {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states (default 15 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modal states
  const [isFloorModalOpen, setIsFloorModalOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);

  // Form states for Floor
  const [floorNumber, setFloorNumber] = useState<number>(1);
  const [floorName, setFloorName] = useState('');
  const [floorCode, setFloorCode] = useState('');
  const [floorDesc, setFloorDesc] = useState('');

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await commandCenterService.getFacilityFloors();
      setFloors(data);
    } catch (err) {
      console.error('Failed to load facility floors:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, lastUpdated]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleOpenAddFloor = () => {
    setEditingFloor(null);
    const nextNumber = floors.length > 0 ? Math.max(...floors.map((f) => f.floorNumber)) + 1 : 1;
    setFloorNumber(nextNumber);
    setFloorName('');
    setFloorCode(`FL-${String(nextNumber).padStart(2, '0')}`);
    setFloorDesc('');
    setIsFloorModalOpen(true);
  };

  const handleOpenEditFloor = (floor: Floor) => {
    setEditingFloor(floor);
    setFloorNumber(floor.floorNumber);
    setFloorName(floor.name);
    setFloorCode(floor.code);
    setFloorDesc(floor.description || '');
    setIsFloorModalOpen(true);
  };

  const handleSaveFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFloor) {
        await commandCenterService.updateFloor(editingFloor.id, {
          floorNumber,
          name: floorName,
          code: floorCode,
          description: floorDesc,
        });
        showNotification(`Floor "${floorName}" updated successfully.`);
      } else {
        await commandCenterService.createFloor({
          floorNumber,
          name: floorName,
          code: floorCode,
          description: floorDesc,
        });
        showNotification(`New Floor "${floorName}" created successfully.`);
      }
      setIsFloorModalOpen(false);
      await loadData();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to save floor', 'error');
    }
  };

  const handleDeleteFloor = async (floor: Floor) => {
    if (!window.confirm(`Are you sure you want to delete "${floor.name}" and all associated rooms?`)) return;
    try {
      await commandCenterService.deleteFloor(floor.id);
      showNotification(`Floor "${floor.name}" deleted.`);
      await loadData();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to delete floor', 'error');
    }
  };

  // Aggregated metrics
  const totalFloors = floors.length;
  const totalRooms = floors.reduce((acc, f) => acc + (f.zones?.length || 0), 0);
  const safeRooms = floors.reduce(
    (acc, f) => acc + (f.zones?.filter((z) => z.isSafePerimeter).length || 0),
    0
  );
  const restrictedRooms = floors.reduce(
    (acc, f) => acc + (f.zones?.filter((z) => !z.isSafePerimeter).length || 0),
    0
  );

  // Filtered floors
  const filteredFloors = floors.filter((f) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.code.toLowerCase().includes(q) ||
      (f.description && f.description.toLowerCase().includes(q)) ||
      `floor ${f.floorNumber}`.includes(q)
    );
  });

  const totalFiltered = filteredFloors.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const paginatedFloors = filteredFloors.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Page Title & Tagline Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
            Floors
          </h2>
        </div>

        <button
          onClick={handleOpenAddFloor}
          className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-emerald-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Floor</span>
        </button>
      </div>

      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl flex items-center justify-between text-xs font-semibold shadow-lg transition-all ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="cursor-pointer opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Telemetry Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Floors */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Facility Floors</p>
            <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">{totalFloors}</p>
          </div>
        </div>

        {/* Total Room Zones */}
        <div
          onClick={() => onNavigateToRooms && onNavigateToRooms()}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3 cursor-pointer hover:border-slate-300 transition"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <DoorOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Room Zones</p>
            <p className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">{totalRooms}</p>
          </div>
        </div>

        {/* Safe Living Zones */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Safe Living Zones</p>
            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{safeRooms}</p>
          </div>
        </div>

        {/* Restricted Egress */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Restricted Egress</p>
            <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">{restrictedRooms}</p>
          </div>
        </div>
      </div>

      {/* Main Floors Table & Controls Container */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Top Controls Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-500" />
              <span>Floors & Architectural Wings</span>
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
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search floor name, code..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Floors Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">Floor Level & Wing</th>
                  <th className="py-3 px-4 font-semibold">Architecture Code</th>
                  <th className="py-3 px-4 font-semibold">Rooms & Zones</th>
                  <th className="py-3 px-4 font-semibold">Perimeter Status</th>
                  <th className="py-3 px-4 font-semibold">Architectural Notes</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3.5 px-4"><div className="h-4 w-36 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-48 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="py-3.5 px-4 text-right"><div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredFloors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 px-4 text-center text-slate-400 dark:text-slate-500">
                      <Building2 className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No floors found</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        {searchQuery
                          ? `No floor levels match "${searchQuery}".`
                          : 'No facility floor levels have been configured.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedFloors.map((floor) => {
                    const zonesCount = floor.zones?.length || 0;
                    const safeCount = floor.zones?.filter((z) => z.isSafePerimeter).length || 0;
                    const restCount = zonesCount - safeCount;

                    return (
                      <tr
                        key={floor.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                      >
                        {/* Floor Level & Wing */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                              L{floor.floorNumber}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">
                                {floor.name}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono">Floor Level {floor.floorNumber}</p>
                            </div>
                          </div>
                        </td>

                        {/* Architecture Code */}
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                            {floor.code}
                          </span>
                        </td>

                        {/* Rooms & Zones */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => onNavigateToRooms && onNavigateToRooms(floor.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800/60 cursor-pointer transition"
                            title="View rooms on this floor"
                          >
                            <DoorOpen className="w-3.5 h-3.5" />
                            <span>{zonesCount} Room Zones</span>
                            <ArrowRight className="w-3 h-3 opacity-60" />
                          </button>
                        </td>

                        {/* Perimeter Status */}
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                              {safeCount} Safe
                            </span>
                            {restCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                                {restCount} Restricted
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Architectural Notes */}
                        <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                          {floor.description || '--'}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditFloor(floor)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition cursor-pointer"
                              title="Edit Floor"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFloor(floor)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                              title="Delete Floor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
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
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs flex items-center gap-1"
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
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs flex items-center gap-1"
              title="Next Page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create / Edit Floor Modal */}
      {isFloorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-500" />
                <span>{editingFloor ? 'Edit Floor Level' : 'Add Architectural Floor Level'}</span>
              </h3>
              <button
                onClick={() => setIsFloorModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFloor} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Floor Number (e.g. 1, 2, 3)
                </label>
                <input
                  type="number"
                  required
                  min={-2}
                  max={20}
                  value={floorNumber}
                  onChange={(e) => setFloorNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Floor Name & Wing Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Floor 2: Memory Care Suites & Therapy Wing"
                  value={floorName}
                  onChange={(e) => setFloorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Architectural Identification Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FL-02"
                  value={floorCode}
                  onChange={(e) => setFloorCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Functional Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Description of clinical functions, patient rooms, or amenities on this level..."
                  value={floorDesc}
                  onChange={(e) => setFloorDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFloorModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs hover:shadow-emerald-500/20 transition cursor-pointer"
                >
                  {editingFloor ? 'Save Changes' : 'Create Floor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
