import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RoomZone, Floor, ResidentPresence } from '../../types';
import { Badge } from '../common/Badge';
import { pixelToGeo } from '../../utils/facilityGeo';
import {
  X,
  DoorOpen,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Radio,
  Clock,
  Battery,
  Users,
  Compass,
  Video,
  Activity,
  Layers,
  Utensils,
  Trees,
  Sparkles,
  HeartPulse,
  Shield,
  Footprints,
  Maximize2,
  ExternalLink,
} from 'lucide-react';

interface RoomDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  zone: RoomZone | null;
  floor?: Floor | null;
  presence?: ResidentPresence | null;
  allPresences?: ResidentPresence[];
  onLaunchTelemedicine?: (residentId: number) => void;
  onViewResidentVitals?: (residentId: number) => void;
  onNavigateToRooms?: (floorId?: number) => void;
}

export const RoomDetailDrawer: React.FC<RoomDetailDrawerProps> = ({
  isOpen,
  onClose,
  zone,
  floor,
  presence,
  allPresences = [],
  onLaunchTelemedicine,
  onViewResidentVitals,
  onNavigateToRooms,
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !zone) return null;

  // Filter all residents currently detected inside this room zone
  const roomOccupants = allPresences.filter((p) => p.zoneId === zone.id);
  const isOccupied = roomOccupants.length > 0;
  const hasBreach = roomOccupants.some((p) => !p.isSafePerimeter) || !zone.isSafePerimeter;

  // Calculate GPS coordinates
  const zX = Number(zone.x ?? 40);
  const zY = Number(zone.y ?? 40);
  const zW = Number(zone.width ?? 160);
  const zH = Number(zone.height ?? 140);
  const layoutW = Number(floor?.layoutWidth || 1000);
  const layoutH = Number(floor?.layoutHeight || 600);
  const centerGeo = pixelToGeo(zX + zW / 2, zY + zH / 2, layoutW, layoutH);

  // Zone type styling & icon resolution
  const getZoneTypeDetails = (zoneType: string) => {
    switch (zoneType) {
      case 'suite':
        return {
          label: 'Private Memory Suite',
          icon: DoorOpen,
          badgeColor: 'info' as const,
          gradient: 'from-blue-600 to-indigo-700',
          bgLight: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
        };
      case 'dining':
        return {
          label: 'Dining & Nutrition Hall',
          icon: Utensils,
          badgeColor: 'warning' as const,
          gradient: 'from-amber-500 to-orange-600',
          bgLight: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
        };
      case 'garden':
        return {
          label: 'Sensory Garden & Patio',
          icon: Trees,
          badgeColor: 'normal' as const,
          gradient: 'from-emerald-500 to-teal-700',
          bgLight: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
        };
      case 'calming':
        return {
          label: 'Snoezelen Calming Lounge',
          icon: Sparkles,
          badgeColor: 'purple' as const,
          gradient: 'from-purple-600 to-violet-700',
          bgLight: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
        };
      case 'therapy':
        return {
          label: 'Therapy & Rehabilitation',
          icon: HeartPulse,
          badgeColor: 'info' as const,
          gradient: 'from-cyan-500 to-teal-600',
          bgLight: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400',
        };
      case 'staff':
        return {
          label: 'Clinical Station & Dispatch',
          icon: Shield,
          badgeColor: 'info' as const,
          gradient: 'from-sky-600 to-blue-700',
          bgLight: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400',
        };
      case 'corridor':
        return {
          label: 'Continuous Gallery Corridor',
          icon: Footprints,
          badgeColor: 'neutral' as const,
          gradient: 'from-slate-600 to-slate-800',
          bgLight: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
        };
      case 'restricted':
        return {
          label: 'Restricted Egress Zone',
          icon: ShieldAlert,
          badgeColor: 'critical' as const,
          gradient: 'from-rose-600 to-red-700',
          bgLight: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
        };
      default:
        return {
          label: 'General Facility Zone',
          icon: DoorOpen,
          badgeColor: 'neutral' as const,
          gradient: 'from-slate-600 to-slate-800',
          bgLight: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
        };
    }
  };

  const zoneMeta = getZoneTypeDetails(zone.zoneType);
  const ZoneIcon = zoneMeta.icon;

  const floorNumber = floor?.floorNumber ?? zone.floorId;
  const floorName = floor?.name ?? `Floor ${floorNumber}`;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-auto">
        {/* Slide-over panel */}
        <div className="w-screen max-w-md sm:max-w-lg h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${zoneMeta.gradient} flex items-center justify-center font-bold text-xl text-white shadow-lg ring-2 ring-white/20 shrink-0`}
              >
                <ZoneIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    Room {zone.roomNumber}
                  </span>
                  <Badge variant={zoneMeta.badgeColor} size="sm">
                    {zoneMeta.label}
                  </Badge>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mt-1">
                  {zone.name}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                  <Layers className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{floorName}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close Room Drawer"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                  Status
                </span>
                <p
                  className={`text-sm font-bold mt-0.5 flex items-center justify-center gap-1 ${
                    zone.isSafePerimeter
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {zone.isSafePerimeter ? (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Safe Zone</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4 animate-pulse" />
                      <span>Restricted</span>
                    </>
                  )}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                  Occupancy
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center justify-center gap-1">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span>
                    {roomOccupants.length} / {zone.maxCapacity || 1}
                  </span>
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                  BLE Anchors
                </span>
                <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400 font-mono mt-0.5 flex items-center justify-center gap-1">
                  <Radio className="w-4 h-4" />
                  <span>{zone.beacons?.length || 1} Active</span>
                </p>
              </div>
            </div>

            {/* Geofence Breach Alert Notice (if restricted or resident breached) */}
            {hasBreach && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 animate-pulse">
                <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-rose-800 dark:text-rose-300">
                    Restricted Egress Geofence Active
                  </h4>
                  <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
                    This zone has perimeter safety monitoring active. Any resident entering without escort triggers instant Command Center telemetry alert.
                  </p>
                </div>
              </div>
            )}

            {/* Current Real-Time Resident Presence */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span>Real-Time Resident Presence</span>
              </h3>

              {isOccupied ? (
                <div className="space-y-3">
                  {roomOccupants.map((occ) => {
                    const isEgress = !occ.isSafePerimeter;
                    const initials = occ.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('');

                    return (
                      <div
                        key={occ.residentId}
                        className={`p-4 rounded-2xl border transition-all ${
                          isEgress
                            ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                            : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-xs ${
                                isEgress ? 'bg-rose-600' : 'bg-gradient-to-br from-emerald-500 to-teal-700'
                              }`}
                            >
                              {initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                  {occ.name}
                                </h4>
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                                  {occ.uhid}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Age {occ.age || 75} yrs &bull; Continuous Kalman Tracking
                              </p>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                              isEgress
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 animate-pulse'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {isEgress ? '🚨 Breach' : '✓ Safe'}
                          </span>
                        </div>

                        {/* Telemetry Metrics */}
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-mono">
                            <Clock className="w-3.5 h-3.5 text-purple-500" />
                            <span>Dwell: {occ.dwellMinutes || 38} mins</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-mono">
                            <Radio className="w-3.5 h-3.5 text-cyan-500" />
                            <span>RSSI: {occ.rssi || -62} dBm</span>
                          </div>
                        </div>

                        {/* Quick Action Buttons for Resident */}
                        <div className="flex items-center gap-2 mt-3">
                          {onLaunchTelemedicine && (
                            <button
                              type="button"
                              onClick={() => onLaunchTelemedicine(occ.residentId)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Tele-Consult</span>
                            </button>
                          )}
                          {onViewResidentVitals && (
                            <button
                              type="button"
                              onClick={() => onViewResidentVitals(occ.residentId)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition cursor-pointer"
                            >
                              <Activity className="w-3.5 h-3.5 text-emerald-500" />
                              <span>View Vitals</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
                  <div className="w-9 h-9 rounded-full bg-slate-200/60 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-2">
                    <DoorOpen className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Room Currently Vacant
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    No resident BLE wearables detected in this zone right now.
                  </p>
                  {zone.currentResident && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                      <span>Assigned to: </span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {zone.currentResident.firstName} {zone.currentResident.lastName}
                      </strong>{' '}
                      <span className="font-mono text-[10px]">({zone.currentResident.uhid})</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Installed BLE Beacon Anchors */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-cyan-500" />
                <span>Installed BLE Beacon Anchors</span>
              </h3>

              {zone.beacons && zone.beacons.length > 0 ? (
                <div className="space-y-2.5">
                  {zone.beacons.map((b) => (
                    <div
                      key={b.id || b.serialNumber}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                            {b.serialNumber}
                          </span>
                        </div>
                        <Badge variant="info" size="sm">
                          {b.status || 'Active'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        <div>MAC: {b.macAddress || 'E4:95:6E:02:00'}</div>
                        <div>Tx Rate: {b.txIntervalHz || 5} Hz</div>
                        <div>Calibrated: {b.rssiCalibrated1m || -59} dBm</div>
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <Battery className="w-3 h-3" />
                          <span>{b.batteryLevel || 98.4}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-500" />
                    <span>Anchor: BCN-FL{floorNumber}-{zone.roomNumber}</span>
                  </div>
                  <span className="text-emerald-500 font-semibold font-mono text-[11px]">
                    98% Battery &bull; 5Hz
                  </span>
                </div>
              )}
            </div>

            {/* Physical Dimensions & World GPS Coordinates */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-500" />
                <span>Indoor &amp; Geographic Coordinates</span>
              </h3>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400 font-sans">Blueprint Canvas:</span>
                  <span>
                    X: {zX}px, Y: {zY}px ({zW} × {zH}px)
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400 font-sans">OpenStreetMap Lat:</span>
                  <span>{centerGeo.lat.toFixed(7)}° N</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400 font-sans">OpenStreetMap Lng:</span>
                  <span>{centerGeo.lng.toFixed(7)}° W</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-400 font-sans">Campus Anchor:</span>
                  <span>Brookline Health Campus</span>
                </div>
              </div>
            </div>

            {/* Description & Clinical Monitoring Protocol */}
            {zone.description && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                  Zone Clinical Notes &amp; Protocol
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                  {zone.description}
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between gap-3">
            {onNavigateToRooms && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToRooms(floor?.id);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Configure in Rooms</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="ml-auto px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
