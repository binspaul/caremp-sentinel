import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Edit2,
  Trash2,
  MapPin,
  Building2,
  Radio,
  DoorOpen,
  X,
  RefreshCw,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Floor, RoomZone, FacilityZoneType } from '../../types';
import commandCenterService from '../../services/commandCenterService';

interface FacilityManageViewProps {
  lastUpdated?: Date;
  onNavigateToMap?: () => void;
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

export const FacilityManageView: React.FC<FacilityManageViewProps> = ({
  lastUpdated,
  onNavigateToMap,
}) => {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<number | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoneTypeFilter, setZoneTypeFilter] = useState<string>('all');
  const [safetyFilter, setSafetyFilter] = useState<string>('all');

  // Pagination states (default 15 items per page)
  const [floorCurrentPage, setFloorCurrentPage] = useState(1);
  const [floorPageSize, setFloorPageSize] = useState(15);
  const [roomCurrentPage, setRoomCurrentPage] = useState(1);
  const [roomPageSize, setRoomPageSize] = useState(15);

  // Modals state
  const [isFloorModalOpen, setIsFloorModalOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);

  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomZone | null>(null);

  // Form states for Floor
  const [floorNumber, setFloorNumber] = useState<number>(3);
  const [floorName, setFloorName] = useState('');
  const [floorCode, setFloorCode] = useState('');
  const [floorDesc, setFloorDesc] = useState('');

  // Form states for Room
  const [roomFloorId, setRoomFloorId] = useState<number>(2);
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

  // Floor CRUD handlers
  const handleOpenCreateFloor = () => {
    const nextNum = floors.length > 0 ? Math.max(...floors.map((f) => f.floorNumber)) + 1 : 1;
    setEditingFloor(null);
    setFloorNumber(nextNum);
    setFloorName(`Floor ${nextNum}: Memory Care Wing`);
    setFloorCode(`FL-0${nextNum}`);
    setFloorDesc('Resident care suites, observation corridors, and staff station.');
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
      if (selectedFloorId === floor.id) setSelectedFloorId('all');
      await loadData();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to delete floor', 'error');
    }
  };

  // Room CRUD handlers
  const handleOpenCreateRoom = () => {
    setEditingRoom(null);
    const defaultFloorId = typeof selectedFloorId === 'number' ? selectedFloorId : (floors[0]?.id || 1);
    setRoomFloorId(defaultFloorId);
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

  // Aggregate metrics
  const allZones = floors.flatMap((f) =>
    f.zones.map((z) => ({
      ...z,
      floorName: f.name,
      floorNumber: f.floorNumber,
    }))
  );

  const totalFloors = floors.length;
  const totalRooms = allZones.length;
  const safeRooms = allZones.filter((z) => z.isSafePerimeter).length;
  const restrictedRooms = allZones.filter((z) => !z.isSafePerimeter).length;
  const totalBeaconsAssigned = allZones.reduce((acc, z) => acc + (z.beacons?.length || 0), 0);

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
      z.floorName.toLowerCase().includes(q)
    );
  });

  // Paginated floors
  const totalFloorPages = Math.max(1, Math.ceil(floors.length / floorPageSize));
  const paginatedFloors = floors.slice(
    (floorCurrentPage - 1) * floorPageSize,
    floorCurrentPage * floorPageSize
  );

  // Paginated rooms
  const totalRoomPages = Math.max(1, Math.ceil(filteredZones.length / roomPageSize));
  const paginatedZones = filteredZones.slice(
    (roomCurrentPage - 1) * roomPageSize,
    roomCurrentPage * roomPageSize
  );

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-emerald-500" />
            Floors & Architectural Wings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Architectural floor level mapping, resident room boundaries, safe perimeters, and clinical ward configurations
          </p>
        </div>
        {onNavigateToMap && (
          <button
            onClick={onNavigateToMap}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer self-start sm:self-auto"
          >
            <MapPin className="w-4 h-4 text-cyan-500" />
            <span>View Facility Map</span>
          </button>
        )}
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Facility Floors</p>
            <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">{totalFloors}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <DoorOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Rooms / Zones</p>
            <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">{totalRooms}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Safe Perimeters</p>
            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{safeRooms}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Restricted / Egress</p>
            <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">{restrictedRooms}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Assigned BLE Anchors</p>
            <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">{totalBeaconsAssigned}</p>
          </div>
        </div>
      </div>

      {/* Floors Section Header & Selector Tabs */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Floors & Architectural Wings</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure facility floor levels, dimensions, and architectural topology.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToMap && (
              <button
                onClick={onNavigateToMap}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-cyan-500" />
                <span>View on Map</span>
              </button>
            )}
            <button
              onClick={handleOpenCreateFloor}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Floor</span>
            </button>
          </div>
        </div>

        {/* Floor Cards / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedFloors.map((floor) => {
            const isSelected = selectedFloorId === floor.id;
            const floorZones = floor.zones || [];
            const safeCount = floorZones.filter((z) => z.isSafePerimeter).length;
            const restrictedCount = floorZones.filter((z) => !z.isSafePerimeter).length;

            return (
              <div
                key={floor.id}
                onClick={() => setSelectedFloorId(isSelected ? 'all' : floor.id)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                      {floor.code || `F${floor.floorNumber}`}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{floor.name}</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        Level {floor.floorNumber} • {floor.layoutWidth}x{floor.layoutHeight}px grid
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenEditFloor(floor)}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg transition"
                      title="Edit Floor"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {floors.length > 1 && (
                      <button
                        onClick={() => handleDeleteFloor(floor)}
                        className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        title="Delete Floor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 line-clamp-2">
                  {floor.description || 'Dedicated memory care inpatient suite.'}
                </p>

                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{floorZones.length}</span> Rooms
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{safeCount} Safe</span>
                    {restrictedCount > 0 && (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">{restrictedCount} Restricted</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floors Pagination Footer */}
        <div className="p-3 px-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-8 text-xs font-sans text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-500 dark:text-slate-400">
            <span>
              Showing{' '}
              <strong className="text-slate-900 dark:text-white font-mono">
                {floors.length === 0 ? 0 : (floorCurrentPage - 1) * floorPageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-900 dark:text-white font-mono">
                {Math.min(floorCurrentPage * floorPageSize, floors.length)}
              </strong>{' '}
              of <strong className="text-slate-900 dark:text-white font-mono">{floors.length}</strong> floors
            </span>

            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={floorPageSize}
                onChange={(e) => {
                  setFloorPageSize(Number(e.target.value));
                  setFloorCurrentPage(1);
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

          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={() => setFloorCurrentPage(1)}
              disabled={floorCurrentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setFloorCurrentPage((p) => Math.max(1, p - 1))}
              disabled={floorCurrentPage <= 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs flex items-center gap-1"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <div className="flex items-center gap-1 px-2">
              <span className="text-slate-600 dark:text-slate-400 font-mono">
                Page <strong className="text-slate-900 dark:text-white">{floorCurrentPage}</strong> of{' '}
                <strong className="text-slate-900 dark:text-white">{totalFloorPages}</strong>
              </span>
            </div>

            <button
              onClick={() => setFloorCurrentPage((p) => Math.min(totalFloorPages, p + 1))}
              disabled={floorCurrentPage >= totalFloorPages}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs flex items-center gap-1"
              title="Next Page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setFloorCurrentPage(totalFloorPages)}
              disabled={floorCurrentPage >= totalFloorPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Room Zones Management Section */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mr-2">
              <DoorOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Rooms & Monitored Zones</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {filteredZones.length}
              </span>
            </h2>

            {/* Floor filter toggle pills */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => {
                  setSelectedFloorId('all');
                  setRoomCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg transition ${
                  selectedFloorId === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Floors
              </button>
              {floors.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setSelectedFloorId(f.id);
                    setRoomCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    selectedFloorId === f.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {f.code || `Floor ${f.floorNumber}`}
                </button>
              ))}
            </div>
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
                  setRoomCurrentPage(1);
                }}
                placeholder="Search rooms, suites, exits..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Zone Type Filter */}
            <select
              value={zoneTypeFilter}
              onChange={(e) => {
                setZoneTypeFilter(e.target.value);
                setRoomCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-indigo-500"
            >
              <option value="all">All Zone Types</option>
              <option value="suite">Resident Suites</option>
              <option value="corridor">Corridors</option>
              <option value="common">Common Areas</option>
              <option value="dining">Dining Halls</option>
              <option value="garden">Sensory Gardens</option>
              <option value="calming">Calming Lounges</option>
              <option value="staff">Clinical Desks</option>
              <option value="restricted">Restricted Egress</option>
            </select>

            {/* Safety Filter */}
            <select
              value={safetyFilter}
              onChange={(e) => {
                setSafetyFilter(e.target.value);
                setRoomCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-indigo-500"
            >
              <option value="all">All Boundaries</option>
              <option value="safe">Safe Perimeters Only</option>
              <option value="restricted">Restricted Zones Only</option>
            </select>

            {/* Add Room Button */}
            <button
              onClick={handleOpenCreateRoom}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer ml-auto sm:ml-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Room Zone</span>
            </button>
          </div>
        </div>

        {/* Room Zones Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Room / Code</th>
                <th className="px-4 py-3">Zone Name & Floor</th>
                <th className="px-4 py-3">Type Classification</th>
                <th className="px-4 py-3">Safety Boundary</th>
                <th className="px-4 py-3">BLE Anchors</th>
                <th className="px-4 py-3">Current Occupancy</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredZones.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                    No room zones matching current criteria.
                  </td>
                </tr>
              ) : (
                paginatedZones.map((zone) => {
                  const typeMeta = ZONE_TYPE_LABELS[zone.zoneType] || ZONE_TYPE_LABELS.suite;
                  const resident = zone.currentResident;

                  return (
                    <tr
                      key={zone.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                    >
                      {/* Room Code */}
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                        <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {zone.roomNumber}
                        </span>
                      </td>

                      {/* Name & Floor */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{zone.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {zone.floorName} (L{zone.floorNumber})
                        </div>
                      </td>

                      {/* Zone Type */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${typeMeta.color}`}
                        >
                          {typeMeta.label}
                        </span>
                      </td>

                      {/* Safety Boundary */}
                      <td className="px-4 py-3">
                        {zone.isSafePerimeter ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            Safe Perimeter
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold animate-pulse">
                            <ShieldAlert className="w-3 h-3 text-rose-500" />
                            Restricted Egress
                          </span>
                        )}
                      </td>

                      {/* BLE Anchors */}
                      <td className="px-4 py-3 font-mono">
                        {zone.beacons && zone.beacons.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1">
                            {zone.beacons.map((b, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded-sm bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px]"
                                title={b.serialNumber}
                              >
                                {b.serialNumber}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Unpaired</span>
                        )}
                      </td>

                      {/* Resident */}
                      <td className="px-4 py-3">
                        {resident ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-[11px] font-medium border border-teal-200 dark:border-teal-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                            {resident.firstName} {resident.lastName}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Vacant</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditRoom(zone)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg transition"
                            title="Edit Room"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(zone)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 rounded-lg transition"
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

        {/* Rooms Pagination Footer */}
        <div className="p-3 px-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-8 text-xs font-sans text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-500 dark:text-slate-400">
            <span>
              Showing{' '}
              <strong className="text-slate-900 dark:text-white font-mono">
                {filteredZones.length === 0 ? 0 : (roomCurrentPage - 1) * roomPageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-900 dark:text-white font-mono">
                {Math.min(roomCurrentPage * roomPageSize, filteredZones.length)}
              </strong>{' '}
              of <strong className="text-slate-900 dark:text-white font-mono">{filteredZones.length}</strong> rooms
            </span>

            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={roomPageSize}
                onChange={(e) => {
                  setRoomPageSize(Number(e.target.value));
                  setRoomCurrentPage(1);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-indigo-500 cursor-pointer shadow-xs"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={() => setRoomCurrentPage(1)}
              disabled={roomCurrentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setRoomCurrentPage((p) => Math.max(1, p - 1))}
              disabled={roomCurrentPage <= 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs flex items-center gap-1"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <div className="flex items-center gap-1 px-2">
              <span className="text-slate-600 dark:text-slate-400 font-mono">
                Page <strong className="text-slate-900 dark:text-white">{roomCurrentPage}</strong> of{' '}
                <strong className="text-slate-900 dark:text-white">{totalRoomPages}</strong>
              </span>
            </div>

            <button
              onClick={() => setRoomCurrentPage((p) => Math.min(totalRoomPages, p + 1))}
              disabled={roomCurrentPage >= totalRoomPages}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs flex items-center gap-1"
              title="Next Page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setRoomCurrentPage(totalRoomPages)}
              disabled={roomCurrentPage >= totalRoomPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Add / Edit Floor */}
      {isFloorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button
              onClick={() => setIsFloorModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>{editingFloor ? 'Edit Facility Floor' : 'Create New Floor'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Specify floor level numbering, designation code, and clinical focus.
            </p>

            <form onSubmit={handleSaveFloor} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Floor Number
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    required
                    value={floorNumber}
                    onChange={(e) => setFloorNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Floor Code
                  </label>
                  <input
                    type="text"
                    required
                    value={floorCode}
                    onChange={(e) => setFloorCode(e.target.value)}
                    placeholder="FL-03"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Floor Name / Wing Designation
                </label>
                <input
                  type="text"
                  required
                  value={floorName}
                  onChange={(e) => setFloorName(e.target.value)}
                  placeholder="Floor 3: High-Acuity Memory Ward"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description / Clinical Profile
                </label>
                <textarea
                  rows={2}
                  value={floorDesc}
                  onChange={(e) => setFloorDesc(e.target.value)}
                  placeholder="Private memory suites, central acute telemetry station, and enclosed wandering promenade."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFloorModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md transition active:scale-95 cursor-pointer"
                >
                  {editingFloor ? 'Save Floor' : 'Create Floor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Room Zone */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
            <button
              onClick={() => setIsRoomModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
              <DoorOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>{editingRoom ? 'Edit Room Zone' : 'Register New Room Zone'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Configure room coordinates, zone classification, and safe-perimeter geofencing.
            </p>

            <form onSubmit={handleSaveRoom} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Floor Assignment
                  </label>
                  <select
                    value={roomFloorId}
                    onChange={(e) => setRoomFloorId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500"
                  >
                    {floors.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} (L{f.floorNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Room Number / Code
                  </label>
                  <input
                    type="text"
                    required
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="205, 108A, FOYER"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Suite 205 (Private Room)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Zone Classification
                  </label>
                  <select
                    value={roomZoneType}
                    onChange={(e) => {
                      const val = e.target.value as FacilityZoneType;
                      setRoomZoneType(val);
                      if (val === 'restricted') setRoomIsSafe(false);
                      else setRoomIsSafe(true);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="suite">Resident Suite</option>
                    <option value="corridor">Corridor / Promenade</option>
                    <option value="common">Community Lounge</option>
                    <option value="dining">Dining Hall</option>
                    <option value="garden">Sensory Garden Safe Zone</option>
                    <option value="calming">Sensory Calming Room</option>
                    <option value="therapy">Physiotherapy Studio</option>
                    <option value="staff">Clinical Staff Desk</option>
                    <option value="restricted">Restricted Egress / Exit Door</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Max Resident Capacity
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={roomCapacity}
                    onChange={(e) => setRoomCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Safe Perimeter Geofence Toggle */}
              <div
                onClick={() => setRoomIsSafe(!roomIsSafe)}
                className={`p-3 rounded-xl border-2 cursor-pointer transition flex items-center justify-between ${
                  roomIsSafe
                    ? 'border-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30 dark:border-emerald-800'
                    : 'border-rose-400 bg-rose-50/70 dark:bg-rose-950/40 dark:border-rose-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {roomIsSafe ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  )}
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      {roomIsSafe ? 'Within Safe Memory Perimeter' : 'Restricted Egress Zone'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {roomIsSafe
                        ? 'Resident can roam freely without triggering wander alerts.'
                        : 'Entering this zone immediately triggers a geofence wander alert.'}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-10 h-5 rounded-full p-0.5 transition ${
                    roomIsSafe ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      roomIsSafe ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Map Layout Coordinates */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Map Grid Coordinates (px)</span>
                </p>
                <div className="grid grid-cols-4 gap-2 font-mono">
                  <div>
                    <label className="text-[10px] text-slate-400">X Position</label>
                    <input
                      type="number"
                      value={roomX}
                      onChange={(e) => setRoomX(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Y Position</label>
                    <input
                      type="number"
                      value={roomY}
                      onChange={(e) => setRoomY(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Width</label>
                    <input
                      type="number"
                      value={roomW}
                      onChange={(e) => setRoomW(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Height</label>
                    <input
                      type="number"
                      value={roomH}
                      onChange={(e) => setRoomH(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description / Amenities
                </label>
                <input
                  type="text"
                  value={roomDesc}
                  onChange={(e) => setRoomDesc(e.target.value)}
                  placeholder="En-suite bathroom, circadian smart lighting, low bed frame."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md transition active:scale-95 cursor-pointer"
                >
                  {editingRoom ? 'Save Room' : 'Register Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
