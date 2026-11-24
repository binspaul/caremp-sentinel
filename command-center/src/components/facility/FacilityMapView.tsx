import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Radio,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Users,
  Layers,
  ChevronDown,
  Activity,
  Grid,
} from 'lucide-react';
import { Floor, RoomZone, ResidentPresence } from '../../types';
import commandCenterService from '../../services/commandCenterService';
import { RoomDetailDrawer } from './RoomDetailDrawer';

interface FacilityMapViewProps {
  lastUpdated?: Date;
  onLaunchTelemedicine?: (residentId: number) => void;
  onViewResidentVitals?: (residentId: number) => void;
  onNavigateToRooms?: (floorId?: number) => void;
  targetRoomNumber?: string | null;
}

export const FacilityMapView: React.FC<FacilityMapViewProps> = ({
  lastUpdated,
  onLaunchTelemedicine,
  onViewResidentVitals,
  onNavigateToRooms,
  targetRoomNumber,
}) => {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [presenceList, setPresenceList] = useState<ResidentPresence[]>([]);
  const [selectedFloorNumber, setSelectedFloorNumber] = useState<number>(2);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedZone, setSelectedZone] = useState<RoomZone | null>(null);
  const [selectedPresence, setSelectedPresence] = useState<ResidentPresence | null>(null);
  const [isRoomDrawerOpen, setIsRoomDrawerOpen] = useState(false);
  const [alertBanner, setAlertBanner] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [floorsRes, presenceRes] = await Promise.all([
        commandCenterService.getFacilityFloors(),
        commandCenterService.getFacilityPresence(),
      ]);
      setFloors(floorsRes);
      setPresenceList(presenceRes);

      // If a target room is requested (e.g. from a fall alert), auto-switch floor
      if (targetRoomNumber) {
        const floorWithRoom = floorsRes.find((f) =>
          f.zones?.some((z) => z.roomNumber.toLowerCase() === targetRoomNumber.toLowerCase()),
        );
        if (floorWithRoom) {
          setSelectedFloorNumber(floorWithRoom.floorNumber);
          const zone = floorWithRoom.zones?.find(
            (z) => z.roomNumber.toLowerCase() === targetRoomNumber.toLowerCase(),
          );
          if (zone) {
            setSelectedZone(zone);
            setIsRoomDrawerOpen(true);
          }
        }
      } else if (floorsRes && floorsRes.length > 0) {
        // Ensure selectedFloorNumber exists in loaded floors
        const exists = floorsRes.some((f) => f.floorNumber === selectedFloorNumber);
        if (!exists) {
          setSelectedFloorNumber(floorsRes[0].floorNumber);
        }
      }
    } catch (err) {
      console.error('Failed to load facility map data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [lastUpdated, selectedFloorNumber]);

  const activeFloor =
    floors.find((f) => f.floorNumber === selectedFloorNumber) || floors[0];

  const floorPresence = presenceList.filter(
    (p) => p.floorNumber === selectedFloorNumber,
  );

  const hasBreachOnFloor = floorPresence.some((p) => !p.isSafePerimeter);

  const getZoneFill = (zone: RoomZone) => {
    switch (zone.zoneType) {
      case 'suite':
        return 'fill-slate-50 dark:fill-slate-900/90 stroke-slate-200 dark:stroke-slate-800 hover:stroke-emerald-500/60';
      case 'corridor':
        return 'fill-slate-100/60 dark:fill-slate-950/40 stroke-slate-200/80 dark:stroke-slate-800/80';
      case 'dining':
        return 'fill-amber-500/5 dark:fill-amber-950/20 stroke-amber-500/30 hover:stroke-amber-500/60';
      case 'garden':
        return 'fill-emerald-500/10 dark:fill-emerald-950/30 stroke-emerald-500/40 hover:stroke-emerald-500/70';
      case 'calming':
        return 'fill-purple-500/10 dark:fill-purple-950/30 stroke-purple-500/40 hover:stroke-purple-500/70';
      case 'therapy':
        return 'fill-cyan-500/10 dark:fill-cyan-950/30 stroke-cyan-500/30 hover:stroke-cyan-500/60';
      case 'staff':
        return 'fill-blue-500/10 dark:fill-blue-950/30 stroke-blue-500/40 hover:stroke-blue-500/70';
      case 'restricted':
        return 'fill-rose-500/15 dark:fill-rose-950/30 stroke-rose-500/60 stroke-dasharray-[6,4] animate-pulse-slow';
      default:
        return 'fill-slate-50 dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Tagline Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <MapPin className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
            <span>Facility Map</span>
            <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Vector Blueprint
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Interactive multi-floor spatial topology, memory care safe-zones, BLE micro-anchors, and live resident presence
          </p>
        </div>
      </div>

      {/* Geofence Breach Alert Notification Banner */}
      {alertBanner && (
        <div className="p-3.5 rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-900/30 flex items-center justify-between gap-3 animate-shake">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-300 animate-bounce shrink-0" />
            <div>
              <p className="text-xs font-bold tracking-tight">{alertBanner}</p>
              <p className="text-[11px] text-rose-100">
                Floor staff alerted &bull; Doorway lock armed &bull; WebRTC Telehealth link available
              </p>
            </div>
          </div>
          <button
            onClick={() => setAlertBanner(null)}
            className="px-3 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Telemetry Summary Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active Residents on Floor */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active on Level {selectedFloorNumber}</p>
            <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
              {floorPresence.length} <span className="text-xs font-normal text-slate-400 font-sans">residents</span>
            </p>
          </div>
        </div>

        {/* BLE Beacon Coverage */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">BLE Beacon Anchors</p>
            <p className="text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
              {activeFloor?.zones?.reduce((acc, z) => acc + (z.beacons?.length || 1), 0) ?? 0}{' '}
              <span className="text-xs font-normal text-emerald-500 font-sans font-semibold">Active</span>
            </p>
          </div>
        </div>

        {/* Geofence Perimeter */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              hasBreachOnFloor
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {hasBreachOnFloor ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Geofence Perimeter</p>
            <p
              className={`text-xl font-bold font-mono ${
                hasBreachOnFloor ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {hasBreachOnFloor ? 'Egress Breach' : '100% Safe'}
            </p>
          </div>
        </div>

        {/* Average Room Dwell */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Average Room Dwell</p>
            <p className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
              42 <span className="text-xs font-normal text-slate-400 font-sans">mins / zone</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Vector Blueprint Canvas Container */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Top Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Grid className="w-5 h-5 text-emerald-500" />
              <span>Spatial Blueprint</span>
            </h2>
            <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Level {selectedFloorNumber}
            </span>
          </div>

          {/* Floor Selection Dropdown (Compact Width - Floor Name Only) */}
          <div className="relative w-auto min-w-[140px] sm:min-w-[170px]">
            <select
              value={selectedFloorNumber}
              onChange={(e) => {
                setSelectedFloorNumber(Number(e.target.value));
                setSelectedZone(null);
                setSelectedPresence(null);
              }}
              aria-label="Select Facility Floor"
              className="w-full appearance-none pl-8 pr-8 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-xs hover:border-emerald-500 dark:hover:border-emerald-500 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition truncate"
            >
              {floors.map((f) => (
                <option key={f.id} value={f.floorNumber}>
                  {f.name || `Floor ${f.floorNumber}`}
                </option>
              ))}
            </select>
            <Layers className="w-3.5 h-3.5 text-emerald-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Vector Blueprint Canvas View */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/50 relative shadow-inner">
          <div className="w-full flex items-center justify-center p-2 sm:p-4">
            <svg
              viewBox={`0 0 ${activeFloor?.layoutWidth || 1000} ${activeFloor?.layoutHeight || 600}`}
              className="w-full h-auto select-none block"
              style={{ shapeRendering: 'geometricPrecision' }}
            >
              {/* Background architectural grid */}
              <defs>
                <pattern id="archGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-slate-200/50 dark:text-slate-800/50"
                  />
                </pattern>
              </defs>
              <rect width={activeFloor?.layoutWidth || 1000} height={activeFloor?.layoutHeight || 600} fill="url(#archGrid)" />

              {/* Perimeter Building Outer Wall */}
              <rect
                x="20"
                y="20"
                width={(activeFloor?.layoutWidth || 1000) - 40}
                height={(activeFloor?.layoutHeight || 600) - 40}
                rx="12"
                fill="none"
                strokeWidth="3"
                className="stroke-slate-300 dark:stroke-slate-700"
              />

              {/* Render Reduced & Inset Room Tiles */}
              {activeFloor?.zones && activeFloor.zones.length > 0 ? (
                activeFloor.zones.map((zone) => {
                  const isSelected = selectedZone?.id === zone.id;

                  const inset = 4;
                  const numX = Number(zone.x ?? 40);
                  const numY = Number(zone.y ?? 40);
                  const numW = Number(zone.width ?? 160);
                  const numH = Number(zone.height ?? 140);
                  const rx = numX + inset;
                  const ry = numY + inset;
                  const rw = Math.max(20, numW - inset * 2);
                  const rh = Math.max(20, numH - inset * 2);

                  return (
                    <g
                      key={zone.id}
                      onClick={() => {
                        setSelectedZone(zone);
                        const p = floorPresence.find((pr) => pr.zoneId === zone.id);
                        setSelectedPresence(p || null);
                        setIsRoomDrawerOpen(true);
                      }}
                      className="cursor-pointer group transition-all"
                    >
                      {/* Zone Base Tile */}
                      <rect
                        x={rx}
                        y={ry}
                        width={rw}
                        height={rh}
                        rx="8"
                        strokeWidth={isSelected ? 2.5 : 1}
                        className={`transition-all ${getZoneFill(zone)} ${
                          isSelected ? 'stroke-cyan-500 shadow-md' : ''
                        }`}
                      />

                      {/* Beacon Indicator Dot at Ceiling Center */}
                      <circle
                        cx={rx + rw - 12}
                        cy={ry + 12}
                        r="2.5"
                        className="fill-cyan-500/80 dark:fill-cyan-400/80 animate-pulse"
                      />
                      <circle
                        cx={rx + rw - 12}
                        cy={ry + 12}
                        r="6"
                        fill="none"
                        strokeWidth="0.8"
                        className="stroke-cyan-500/40 animate-ping"
                      />

                      {/* Room Number Pill */}
                      <rect
                        x={rx + 6}
                        y={ry + 6}
                        width={zone.roomNumber.length * 7 + 10}
                        height="15"
                        rx="4"
                        className="fill-slate-200/90 dark:fill-slate-800/90"
                      />
                      <text
                        x={rx + 11}
                        y={ry + 17}
                        className="text-[9px] font-mono font-bold fill-slate-700 dark:fill-slate-300 pointer-events-none"
                      >
                        {zone.roomNumber}
                      </text>

                      {/* Room Name Label */}
                      <text
                        x={rx + 8}
                        y={ry + 32}
                        className="text-[10px] font-sans font-bold fill-slate-800 dark:fill-slate-200 pointer-events-none"
                      >
                        {zone.name.split(' (')[0]}
                      </text>

                      {/* Zone Type Micro-Badge */}
                      <text
                        x={rx + 8}
                        y={ry + 44}
                        className="text-[8px] font-mono font-medium fill-slate-500 dark:fill-slate-400 uppercase pointer-events-none"
                      >
                        {zone.zoneType} &bull; {zone.isSafePerimeter ? 'Safe' : 'Restricted'}
                      </text>

                      {/* Hover Highlight Ring */}
                      <rect
                        x={rx}
                        y={ry}
                        width={rw}
                        height={rh}
                        rx="8"
                        fill="none"
                        strokeWidth="1.5"
                        className="stroke-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      />
                    </g>
                  );
                })
              ) : (
                <g>
                  <text
                    x="500"
                    y="280"
                    textAnchor="middle"
                    className="text-sm font-semibold fill-slate-400 dark:fill-slate-500 font-sans"
                  >
                    No rooms configured on Floor {selectedFloorNumber} yet
                  </text>
                  <text
                    x="500"
                    y="308"
                    textAnchor="middle"
                    className="text-xs fill-slate-400 dark:fill-slate-500 font-mono"
                  >
                    Add rooms for this floor in Facility &gt; Rooms
                  </text>
                </g>
              )}

              {/* Render Live Resident Avatars on Top */}
              {floorPresence.map((presence) => {
                const isEgress = !presence.isSafePerimeter;
                const px = Number(presence.x || 100);
                const py = Number(presence.y || 100);

                return (
                  <g
                    key={presence.residentId}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPresence(presence);
                      const z = activeFloor?.zones?.find((zn) => zn.id === presence.zoneId);
                      if (z) setSelectedZone(z);
                      setIsRoomDrawerOpen(true);
                    }}
                    className="cursor-pointer group animate-bounce-slow"
                  >
                    {/* Outer Pulsing Ping Ring */}
                    <circle
                      cx={px}
                      cy={py}
                      r={isEgress ? '26' : '20'}
                      fill="none"
                      strokeWidth="1.5"
                      className={`${
                        isEgress
                          ? 'stroke-rose-500 animate-ping'
                          : 'stroke-emerald-500/60 animate-pulse'
                      }`}
                    />

                    {/* Soft Aura Glow */}
                    <circle
                      cx={px}
                      cy={py}
                      r="16"
                      className={`${
                        isEgress ? 'fill-rose-500/30' : 'fill-emerald-500/25'
                      }`}
                    />

                    {/* Resident Avatar Circle */}
                    <circle
                      cx={px}
                      cy={py}
                      r="12"
                      className={`${
                        isEgress
                          ? 'fill-rose-600 stroke-2 stroke-white'
                          : 'fill-emerald-600 stroke-2 stroke-white dark:stroke-slate-900'
                      } shadow-md`}
                    />

                    {/* Initials */}
                    <text
                      x={px}
                      y={py + 3.5}
                      textAnchor="middle"
                      className="text-[9px] font-bold font-sans fill-white pointer-events-none"
                    >
                      {presence.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </text>

                    {/* Resident Label Pill Below Avatar */}
                    <g transform={`translate(${px - 38}, ${py + 16})`}>
                      <rect
                        width="76"
                        height="15"
                        rx="7.5"
                        className={`${
                          isEgress
                            ? 'fill-rose-600 text-white'
                            : 'fill-slate-900/90 dark:fill-white text-white dark:text-slate-900'
                        } shadow-md`}
                      />
                      <text
                        x="38"
                        y="10.5"
                        textAnchor="middle"
                        className={`text-[8px] font-bold font-sans ${
                          isEgress ? 'fill-white' : 'fill-white dark:fill-slate-900'
                        }`}
                      >
                        {presence.name.split(' ')[0]} ({presence.uhid})
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Legend & Functional Topology Strip */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-white uppercase font-mono text-[10px]">
              Legend:
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700" />
              Private Suites
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20 border border-emerald-500/40" />
              Sensory Garden &amp; Patio
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-500/20 border border-purple-500/40" />
              Calming Lounge
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500/20 border border-blue-500/40" />
              Central Telemetry Station
            </span>
            <span className="flex items-center gap-1.5 text-rose-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/30 border border-rose-500 border-dashed" />
              Restricted Stairwell
            </span>
            <span className="flex items-center gap-1.5 text-cyan-500">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              BLE Beacon Anchor
            </span>
          </div>

          <div className="font-mono text-[11px] text-slate-400">
            Real-time multi-frequency RSSI micro-location
          </div>
        </div>
      </div>

      {/* Room Detail Drawer (Right-Hand Slide-Over) */}
      <RoomDetailDrawer
        isOpen={isRoomDrawerOpen && !!selectedZone}
        onClose={() => {
          setIsRoomDrawerOpen(false);
          setSelectedZone(null);
          setSelectedPresence(null);
        }}
        zone={selectedZone}
        floor={activeFloor}
        presence={selectedPresence}
        allPresences={presenceList}
        onLaunchTelemedicine={onLaunchTelemedicine}
        onViewResidentVitals={onViewResidentVitals}
        onNavigateToRooms={onNavigateToRooms}
      />
    </div>
  );
};
