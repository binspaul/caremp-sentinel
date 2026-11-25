import React, { useState, useEffect, useCallback } from 'react';
import {
  DoorOpen,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Edit2,
  Trash2,
  MapPin,
  Building2,
  Radio,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Users,
  Plus,
} from 'lucide-react';
import { Floor, RoomZone, FacilityZoneType } from '../../types';
import commandCenterService from '../../services/commandCenterService';

interface RoomsViewProps {
  lastUpdated?: Date;
  initialFloorId?: number | 'all';
  onNavigateToMap?: () => void;
  onNavigateToFloors?: () => void;
}

const ZONE_TYPE_LABELS: Record<FacilityZoneType, { label: string; color: string }> = {
  suite: { label: 'Resident Suite', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  corridor: { label: 'Corridor / Gallery', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
  common: { label: 'Community Common', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
  dining: { label: 'Dining Hall', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  garden: { label: 'Sensory Garden Safe Zone', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  staff: { label: 'Clinical Staff Desk', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
  therapy: { label: 'Physio / Therapy', color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800' },
  calming: { label: 'Sensory Calming Lounge', color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800' },
  restricted: { label: 'Restricted Egress / Exit', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
};

export const RoomsView: React.FC<RoomsViewProps> = ({
  lastUpdated,
  initialFloorId = 'all',
  onNavigateToMap,
  onNavigateToFloors,
}) => {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<number | 'all'>(initialFloorId);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoneTypeFilter, setZoneTypeFilter] = useState<string>('all');
  const [safetyFilter, setSafetyFilter] = useState<string>('all');

  // Pagination states (default 15 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modals state
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomZone | null>(null);

  // Form states for Room
  const [roomFloorId, setRoomFloorId] = useState<number>(1);
  const [roomNumber, setRoomNumber] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomZoneType, setRoomZoneType] = useState<FacilityZoneType>('suite');
  const [roomIsSafe, setRoomIsSafe] = useState(true);
  const [roomCapacity, setRoomCapacity] = useState(1);
  const [roomDesc, setRoomDesc] = useState('');
  const [roomX, setRoomX] = useState(40);
  const [roomY, setRoomY] = useState(40);
  const [roomW, setRoomW] = useState(160);
  const [roomH, setRoomH] = useState(140);

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await commandCenterService.getFacilityFloors();
      setFloors(data);
      if (data.length > 0 && roomFloorId === 1) {
        setRoomFloorId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load facility floors & rooms:', err);
    } finally {
      setIsLoading(false);
    }
  }, [roomFloorId]);

  useEffect(() => {
    loadData();
  }, [loadData, lastUpdated]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleOpenAddRoom = () => {
    setEditingRoom(null);
    setRoomFloorId(selectedFloorId !== 'all' ? selectedFloorId : (floors[0]?.id || 1));
    setRoomNumber('');
    setRoomName('');
    setRoomZoneType('suite');
    setRoomIsSafe(true);
    setRoomCapacity(1);
    setRoomDesc('');
    setRoomX(40);
    setRoomY(40);
    setRoomW(160);
    setRoomH(140);
    setIsRoomModalOpen(true);
  };

  const handleOpenEditRoom = (room: RoomZone) => {
    setEditingRoom(room);
    setRoomFloorId(room.floorId);
    setRoomNumber(room.roomNumber);
    setRoomName(room.name);
    setRoomZoneType(room.zoneType);
    setRoomIsSafe(room.isSafePerimeter);
    setRoomCapacity(room.maxCapacity || 1);
    setRoomDesc(room.description || '');
    setRoomX(room.x);
    setRoomY(room.y);
    setRoomW(room.width);
    setRoomH(room.height);
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        await commandCenterService.updateRoomZone(editingRoom.id, {
          floorId: roomFloorId,
          roomNumber,
          name: roomName,
          zoneType: roomZoneType,
          isSafePerimeter: roomIsSafe,
          maxCapacity: roomCapacity,
          description: roomDesc,
          x: roomX,
          y: roomY,
          width: roomW,
          height: roomH,
        });
        showNotification(`Room Zone "${roomNumber} - ${roomName}" updated.`);
      } else {
        await commandCenterService.createRoomZone({
          floorId: roomFloorId,
          roomNumber,
          name: roomName,
          zoneType: roomZoneType,
          isSafePerimeter: roomIsSafe,
          maxCapacity: roomCapacity,
          description: roomDesc,
          x: roomX,
          y: roomY,
          width: roomW,
          height: roomH,
        });
        showNotification(`New Room Zone "${roomNumber} - ${roomName}" registered.`);
      }
      setIsRoomModalOpen(false);
      await loadData();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to save room zone', 'error');
    }
  };

  const handleDeleteRoom = async (room: RoomZone) => {
    if (!window.confirm(`Delete room "${room.roomNumber} - ${room.name}"?`)) return;
    try {
      await commandCenterService.deleteRoomZone(room.id);
      showNotification(`Room "${room.roomNumber}" deleted.`);
      await loadData();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to delete room', 'error');
    }
  };

  // Flatten all rooms across floors
  const allZones = floors.flatMap((f) =>
    (f.zones || []).map((z) => ({
      ...z,
      floorName: f.name,
      floorNumber: f.floorNumber,
    }))
  );

  const totalRooms = allZones.length;
  const suiteCount = allZones.filter((z) => z.zoneType === 'suite').length;
  const safeRooms = allZones.filter((z) => z.isSafePerimeter).length;
  const restrictedRooms = allZones.filter((z) => !z.isSafePerimeter).length;

  // Filtered rooms
  const filteredZones = allZones.filter((z) => {
    if (selectedFloorId !== 'all' && z.floorId !== selectedFloorId) return false;
    if (zoneTypeFilter !== 'all' && z.zoneType !== zoneTypeFilter) return false;
    if (safetyFilter === 'safe' && !z.isSafePerimeter) return false;
    if (safetyFilter === 'restricted' && z.isSafePerimeter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      z.roomNumber.toLowerCase().includes(q) ||
      z.name.toLowerCase().includes(q) ||
      (z.description && z.description.toLowerCase().includes(q)) ||
      z.floorName.toLowerCase().includes(q) ||
      `floor ${z.floorNumber}`.toLowerCase().includes(q)
    );
  });

  const totalFiltered = filteredZones.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const paginatedZones = filteredZones.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Page Title & Tagline Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <DoorOpen className="w-6 h-6 text-teal-500 dark:text-teal-400" />
            Rooms
          </h2>
        </div>

        <button
          onClick={handleOpenAddRoom}
          className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-emerald-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Room</span>
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
        {/* Total Rooms */}
        <div
          onClick={() => {
            setSelectedFloorId('all');
            setZoneTypeFilter('all');
            setSafetyFilter('all');
            setCurrentPage(1);
          }}
          className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-3 ${
            selectedFloorId === 'all' && zoneTypeFilter === 'all' && safetyFilter === 'all'
              ? 'border-teal-500 ring-1 ring-teal-500/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <DoorOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Room Zones</p>
            <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">{totalRooms}</p>
          </div>
        </div>

        {/* Resident Suites */}
        <div
          onClick={() => {
            setZoneTypeFilter('suite');
            setCurrentPage(1);
          }}
          className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-3 ${
            zoneTypeFilter === 'suite'
              ? 'border-blue-500 ring-1 ring-blue-500/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Resident Suites</p>
            <p className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">{suiteCount}</p>
          </div>
        </div>

        {/* Safe Living Zones */}
        <div
          onClick={() => {
            setSafetyFilter('safe');
            setCurrentPage(1);
          }}
          className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-3 ${
            safetyFilter === 'safe'
              ? 'border-emerald-500 ring-1 ring-emerald-500/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Safe Living Zones</p>
            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{safeRooms}</p>
          </div>
        </div>

        {/* Restricted Egress */}
        <div
          onClick={() => {
            setSafetyFilter('restricted');
            setCurrentPage(1);
          }}
          className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-3 ${
            safetyFilter === 'restricted'
              ? 'border-rose-500 ring-1 ring-rose-500/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Restricted Egress</p>
            <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">{restrictedRooms}</p>
          </div>
        </div>
      </div>

      {/* Main Rooms Table & Controls Container */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Top Controls Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <DoorOpen className="w-5 h-5 text-teal-500" />
              <span>Rooms</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {totalFiltered}
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-44 flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search room number, name..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl text-xs focus:outline-hidden focus:border-teal-500"
              />
            </div>

            {/* Floor Filter */}
            <select
              value={selectedFloorId}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                setSelectedFloorId(val);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-teal-500 cursor-pointer"
            >
              <option value="all">All Floors</option>
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  Floor {f.floorNumber}: {f.name}
                </option>
              ))}
            </select>

            {/* Zone Type Filter */}
            <select
              value={zoneTypeFilter}
              onChange={(e) => {
                setZoneTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-teal-500 cursor-pointer"
            >
              <option value="all">All Zone Types</option>
              {Object.entries(ZONE_TYPE_LABELS).map(([k, meta]) => (
                <option key={k} value={k}>
                  {meta.label}
                </option>
              ))}
            </select>

            {/* Safety Filter */}
            <select
              value={safetyFilter}
              onChange={(e) => {
                setSafetyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-teal-500 cursor-pointer"
            >
              <option value="all">All Perimeters</option>
              <option value="safe">Safe Living Zones Only</option>
              <option value="restricted">Restricted Egress Only</option>
            </select>
          </div>
        </div>

        {/* Rooms List View Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">Room & Suite</th>
                  <th className="py-3 px-4 font-semibold">Floor & Wing</th>
                  <th className="py-3 px-4 font-semibold">Zone Classification</th>
                  <th className="py-3 px-4 font-semibold">Safety Perimeter</th>
                  <th className="py-3 px-4 font-semibold">Beacon Anchors</th>
                  <th className="py-3 px-4 font-semibold">Spatial Dimensions</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3.5 px-4"><div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-5 w-24 bg-slate-100 dark:bg-slate-800 rounded-full" /></td>
                      <td className="py-3.5 px-4"><div className="h-5 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="py-3.5 px-4 text-right"><div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredZones.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 px-4 text-center text-slate-400 dark:text-slate-500">
                      <DoorOpen className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No rooms found</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        {searchQuery
                          ? `No rooms match "${searchQuery}".`
                          : 'No room zones found for the selected filter.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedZones.map((zone) => {
                    const zoneMeta = ZONE_TYPE_LABELS[zone.zoneType] || {
                      label: zone.zoneType,
                      color: 'bg-slate-100 text-slate-700 border-slate-200',
                    };

                    return (
                      <tr
                        key={zone.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                      >
                        {/* Room & Suite */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                              {zone.roomNumber}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">
                                {zone.name}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono">
                                Room {zone.roomNumber} &bull; Cap: {zone.maxCapacity || 1}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Floor & Wing */}
                        <td className="py-3 px-4">
                          <div className="text-slate-700 dark:text-slate-300">
                            <span className="font-medium text-xs">Floor {zone.floorNumber}</span>
                            <p className="text-[11px] text-slate-400 truncate max-w-40">{zone.floorName}</p>
                          </div>
                        </td>

                        {/* Zone Classification */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${zoneMeta.color}`}
                          >
                            {zoneMeta.label}
                          </span>
                        </td>

                        {/* Safety Perimeter */}
                        <td className="py-3 px-4">
                          {zone.isSafePerimeter ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <ShieldCheck className="w-3 h-3 text-emerald-500" />
                              SAFE ZONE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              <ShieldAlert className="w-3 h-3 text-rose-500" />
                              RESTRICTED
                            </span>
                          )}
                        </td>

                        {/* Beacon Anchors */}
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {zone.beacons && zone.beacons.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1">
                              {zone.beacons.map((b) => (
                                <span
                                  key={b.id}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px]"
                                  title={`Battery: ${b.batteryLevel}%`}
                                >
                                  <Radio className="w-2.5 h-2.5" />
                                  {b.serialNumber}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">Unassigned</span>
                          )}
                        </td>

                        {/* Spatial Dimensions */}
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          <span>pos: ({zone.x}, {zone.y})</span>
                          <span className="block text-[10px] text-slate-400">dim: {zone.width} &times; {zone.height}</span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {onNavigateToMap && (
                              <button
                                onClick={onNavigateToMap}
                                className="p-1.5 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 rounded-lg transition cursor-pointer"
                                title="Locate on Map"
                              >
                                <MapPin className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenEditRoom(zone)}
                              className="p-1.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/50 rounded-lg transition cursor-pointer"
                              title="Edit Room"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRoom(zone)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                              title="Delete Room"
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
                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer shadow-xs"
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
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs flex items-center gap-1"
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
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs flex items-center gap-1"
              title="Next Page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create / Edit Room Modal */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-emerald-500" />
                <span>{editingRoom ? `Edit Room ${editingRoom.roomNumber}` : 'Register New Room Zone'}</span>
              </h3>
              <button
                onClick={() => setIsRoomModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Floor Assignment
                  </label>
                  <select
                    value={roomFloorId}
                    onChange={(e) => setRoomFloorId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    {floors.map((f) => (
                      <option key={f.id} value={f.id}>
                        Floor {f.floorNumber}: {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Room / Zone Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 204 or S-101"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Zone Designation / Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eleanor Vance Suite or Sensory Garden Safe Zone"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Classification Type
                  </label>
                  <select
                    value={roomZoneType}
                    onChange={(e) => setRoomZoneType(e.target.value as FacilityZoneType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    {Object.entries(ZONE_TYPE_LABELS).map(([k, meta]) => (
                      <option key={k} value={k}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Maximum Capacity
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={roomCapacity}
                    onChange={(e) => setRoomCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Safety Perimeter Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer ${
                      roomIsSafe
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="isSafePerimeter"
                      checked={roomIsSafe}
                      onChange={() => setRoomIsSafe(true)}
                      className="text-emerald-600"
                    />
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium">Safe Living Zone</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer ${
                      !roomIsSafe
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-200'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="isSafePerimeter"
                      checked={!roomIsSafe}
                      onChange={() => setRoomIsSafe(false)}
                      className="text-rose-600"
                    />
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    <span className="font-medium">Restricted Egress</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Room Description & Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes regarding room fixtures, ensuite features, or wandering boundaries..."
                  value={roomDesc}
                  onChange={(e) => setRoomDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="block text-slate-600 dark:text-slate-300 font-semibold mb-2">
                  Map Floor Plan Coordinates (px)
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block font-mono">X pos</label>
                    <input
                      type="number"
                      value={roomX}
                      onChange={(e) => setRoomX(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-center focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block font-mono">Y pos</label>
                    <input
                      type="number"
                      value={roomY}
                      onChange={(e) => setRoomY(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-center focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block font-mono">Width</label>
                    <input
                      type="number"
                      value={roomW}
                      onChange={(e) => setRoomW(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-center focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block font-mono">Height</label>
                    <input
                      type="number"
                      value={roomH}
                      onChange={(e) => setRoomH(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-center focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs hover:shadow-emerald-500/20 transition cursor-pointer"
                >
                  {editingRoom ? 'Save Changes' : 'Register Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
