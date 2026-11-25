import React, { useState, useEffect, useRef, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  Users,
  Radio,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronDown,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Zap,
} from 'lucide-react';
import { Floor, RoomZone, ResidentPresence } from '../../types';
import commandCenterService from '../../services/commandCenterService';
import { RoomDetailDrawer } from './RoomDetailDrawer';
import { SimulationModal } from '../simulation/SimulationModal';

interface FacilityMapViewProps {
  lastUpdated?: Date;
  onLaunchTelemedicine?: (residentId: number) => void;
  onViewResidentVitals?: (residentId: number) => void;
  onNavigateToRooms?: (floorId?: number) => void;
  targetRoomNumber?: string | null;
  onMovementSimulated?: () => void;
}

// Dedicated high-resolution clean architectural floor plans per floor
const FLOOR_PLANS: Record<number, { url: string; width: number; height: number }> = {
  1: {
    url: '/floorplans/floor1_ground_garden.jpg',
    width: 1376,
    height: 768,
  },
  2: {
    url: '/floorplans/floor2_memory_care.jpg',
    width: 1376,
    height: 768,
  },
};

// Calibrated pixel coordinates [pixelX, pixelY] in the 1376x768 image
// Guarantees all dots are situated inside open room spaces, never on walls
const ROOM_CALIBRATED_COORDINATES: Record<string, [number, number]> = {
  // Floor 1 (Ground Floor & Therapeutic Sensory Garden)
  '101': [310, 550],  // Welcome Foyer & Reception
  '102': [380, 260],  // Central Dining & Nutrition Hall
  '103': [655, 500],  // Community Lounge & Music Room
  '104': [115, 415],  // Ground Security Post
  '105': [425, 390],  // Garden Promenade Corridor
  '106': [1065, 205], // Therapeutic Sensory Garden
  '107': [755, 255],  // Physiotherapy Studio
  '108': [135, 575],  // Exterior Main Gate (Restricted)

  // Floor 2 (Memory Care Suites & Telemetry Desk)
  '201': [80, 185],   // Suite 201
  '202': [250, 150],  // Suite 202
  '203': [435, 135],  // Suite 203
  '204': [580, 180],  // Suite 204
  '205': [690, 135],  // Suite 205
  '206': [890, 160],  // Suite 206
  '200A': [650, 285], // North Memory Corridor Gallery
  '200B': [560, 360], // Central Acute Telemetry Desk (Nurse Station)
  '207': [1185, 200], // Suite 207
  '208': [1215, 490], // Suite 208
  '209': [1140, 360], // Corridor 4B
  '210': [95, 575],   // Suite 210
  '211': [320, 630],  // Suite 211
  '212': [445, 630],  // Suite 212
  '213': [995, 405],  // Quiet Reading Alcove / Staff Lounge
  '214': [1260, 625], // Fire Stairwell B (Restricted)
};

export const FacilityMapView: React.FC<FacilityMapViewProps> = ({
  lastUpdated,
  onLaunchTelemedicine,
  onViewResidentVitals,
  onNavigateToRooms,
  targetRoomNumber,
  onMovementSimulated,
}) => {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [presenceList, setPresenceList] = useState<ResidentPresence[]>([]);
  const [selectedFloorNumber, setSelectedFloorNumber] = useState<number>(2);
  const [selectedZone, setSelectedZone] = useState<RoomZone | null>(null);
  const [selectedPresence, setSelectedPresence] = useState<ResidentPresence | null>(null);
  const [isRoomDrawerOpen, setIsRoomDrawerOpen] = useState(false);
  const [alertBanner, setAlertBanner] = useState<string | null>(null);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);

  // Layer toggles
  const [showBeacons, setShowBeacons] = useState(true);
  const [showResidents, setShowResidents] = useState(true);

  // Leaflet map container refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const overlayRef = useRef<L.ImageOverlay | null>(null);
  const zoneLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const beaconLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const residentLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const currentFloorPlan = FLOOR_PLANS[selectedFloorNumber] || FLOOR_PLANS[2];

  // Load floors and live presence telemetry
  const loadData = useCallback(async () => {
    try {
      const [floorsRes, presenceRes] = await Promise.all([
        commandCenterService.getFacilityFloors(),
        commandCenterService.getFacilityPresence(),
      ]);
      setFloors(floorsRes);
      setPresenceList(presenceRes);

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
      }
    } catch (err) {
      console.error('Failed to load facility map data:', err);
    }
  }, [targetRoomNumber]);

  useEffect(() => {
    loadData();
  }, [lastUpdated, loadData]);

  const activeFloor = floors.find((f) => f.floorNumber === selectedFloorNumber) || floors[0];
  const floorPresence = presenceList.filter((p) => p.floorNumber === selectedFloorNumber);
  const hasBreachOnFloor = floorPresence.some((p) => !p.isSafePerimeter);

  // Helper to convert room number into exact, wall-free Leaflet coordinates [lat, lng]
  const getRoomLatLng = useCallback(
    (roomNumber: string, fallbackX?: number, fallbackY?: number): [number, number] => {
      const calibrated = ROOM_CALIBRATED_COORDINATES[roomNumber];
      if (calibrated) {
        const [px, py] = calibrated;
        return [currentFloorPlan.height - py, px];
      }

      // Fallback: proportional scaling if room not in lookup
      const layoutW = activeFloor?.layoutWidth || 1000;
      const layoutH = activeFloor?.layoutHeight || 600;
      const x = fallbackX ?? 500;
      const y = fallbackY ?? 300;
      const imgX = (x / layoutW) * currentFloorPlan.width;
      const imgY = (y / layoutH) * currentFloorPlan.height;
      return [currentFloorPlan.height - imgY, imgX];
    },
    [activeFloor, currentFloorPlan],
  );

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        crs: L.CRS.Simple,
        minZoom: -1.5,
        maxZoom: 2.5,
        zoomSnap: 0.1,
        zoomDelta: 0.25,
        attributionControl: false,
        zoomControl: false,
      });

      zoneLayerGroupRef.current = L.layerGroup().addTo(map);
      beaconLayerGroupRef.current = L.layerGroup().addTo(map);
      residentLayerGroupRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const bounds: L.LatLngBoundsLiteral = [
      [0, 0],
      [currentFloorPlan.height, currentFloorPlan.width],
    ];

    if (overlayRef.current) {
      map.removeLayer(overlayRef.current);
    }
    const overlay = L.imageOverlay(currentFloorPlan.url, bounds, {
      interactive: true,
      opacity: 1.0,
    }).addTo(map);
    overlayRef.current = overlay;
    overlay.bringToBack();

    // Fit entire floor plan cleanly to container with padding
    map.fitBounds(bounds, { padding: [16, 16], maxZoom: 1 });

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedFloorNumber, currentFloorPlan]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Invisible Room Zone Hitboxes (NO intrusive lines or boxes on top of the map)
  useEffect(() => {
    if (!mapInstanceRef.current || !zoneLayerGroupRef.current) return;
    const zoneGroup = zoneLayerGroupRef.current;
    zoneGroup.clearLayers();

    if (!activeFloor?.zones) return;

    activeFloor.zones.forEach((zone) => {
      const [centerLat, centerLng] = getRoomLatLng(
        zone.roomNumber,
        Number(zone.x || 500) + Number(zone.width || 100) / 2,
        Number(zone.y || 300) + Number(zone.height || 100) / 2,
      );

      const isRestricted = zone.zoneType === 'restricted';
      const isSelected = selectedZone?.id === zone.id;

      // Circular interactive hitbox around room center - 100% invisible by default
      const circle = L.circle([centerLat, centerLng], {
        radius: 38,
        stroke: isSelected,
        color: isRestricted ? '#f43f5e' : '#10b981',
        weight: isSelected ? 2 : 0,
        fill: isSelected,
        fillColor: isRestricted ? '#f43f5e' : '#10b981',
        fillOpacity: isSelected ? 0.15 : 0,
      });

      // Subtle gentle glow on hover only
      circle.on('mouseover', () => {
        circle.setStyle({
          stroke: true,
          color: isRestricted ? '#f43f5e' : '#10b981',
          weight: 1.5,
          fill: true,
          fillColor: isRestricted ? '#f43f5e' : '#10b981',
          fillOpacity: 0.12,
        });
      });

      circle.on('mouseout', () => {
        if (!isSelected) {
          circle.setStyle({
            stroke: false,
            weight: 0,
            fill: false,
            fillOpacity: 0,
          });
        }
      });

      circle.on('click', () => {
        setSelectedZone(zone);
        const p = floorPresence.find((pr) => pr.zoneId === zone.id);
        setSelectedPresence(p || null);
        setIsRoomDrawerOpen(true);
      });

      circle.bindTooltip(
        `<div class="text-xs font-semibold px-1 py-0.5">${zone.roomNumber} &bull; ${zone.name}</div>`,
        { direction: 'top', sticky: true, className: 'leaflet-custom-tooltip' },
      );

      zoneGroup.addLayer(circle);
    });
  }, [activeFloor, selectedZone, floorPresence, getRoomLatLng]);

  // Precise BLE Beacon Micro-Anchors (Placed clearly inside room open ceiling space, away from walls)
  useEffect(() => {
    if (!mapInstanceRef.current || !beaconLayerGroupRef.current) return;
    const beaconGroup = beaconLayerGroupRef.current;
    beaconGroup.clearLayers();

    if (!showBeacons || !activeFloor?.zones) return;

    activeFloor.zones.forEach((zone) => {
      const [centerLat, centerLng] = getRoomLatLng(
        zone.roomNumber,
        Number(zone.x || 500),
        Number(zone.y || 300),
      );

      // Offset beacon slightly north-east of room center so resident avatar and beacon don't overlap
      const beaconLat = centerLat + 14;
      const beaconLng = centerLng + 16;

      const beaconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer" style="width: 20px; height: 20px;">
          <div class="absolute inset-0 rounded-full bg-cyan-400/25 animate-ping"></div>
          <div class="w-3 h-3 rounded-full bg-cyan-500 border border-white shadow-xs flex items-center justify-center">
            <div class="w-1 h-1 rounded-full bg-white"></div>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-beacon-marker',
        html: beaconHtml,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const beaconSerial = zone.beacons?.[0]?.serialNumber || `BCN-${zone.roomNumber}`;
      const marker = L.marker([beaconLat, beaconLng], { icon });

      marker.bindTooltip(
        `
        <div class="text-[11px] p-1 font-mono">
          <p class="font-bold text-cyan-400">📶 ${beaconSerial}</p>
          <p class="text-slate-300">Room: ${zone.roomNumber}</p>
          <p class="text-slate-400 text-[10px]">RSSI: -62 dBm &bull; Batt: 98%</p>
        </div>
        `,
        { direction: 'top', className: 'leaflet-custom-tooltip' },
      );

      beaconGroup.addLayer(marker);
    });
  }, [activeFloor, showBeacons, getRoomLatLng]);

  // Precise Live Resident Avatars (Placed clearly in room centers / walking zones)
  useEffect(() => {
    if (!mapInstanceRef.current || !residentLayerGroupRef.current) return;
    const residentGroup = residentLayerGroupRef.current;
    residentGroup.clearLayers();

    if (!showResidents) return;

    floorPresence.forEach((presence) => {
      const isEgress = !presence.isSafePerimeter;

      // Locate resident exactly in their room's calibrated open center
      const [rLat, rLng] = getRoomLatLng(presence.roomNumber, Number(presence.x), Number(presence.y));

      const initials = presence.name
        .split(' ')
        .map((n) => n[0])
        .join('');

      const residentHtml = `
        <div class="relative flex flex-col items-center cursor-pointer select-none" style="transform: translate(-50%, -50%);">
          <!-- Pulse Halo -->
          <div class="absolute -top-1 w-10 h-10 rounded-full ${
            isEgress ? 'bg-rose-500/40 animate-ping' : 'bg-emerald-500/30 animate-pulse'
          }"></div>

          <!-- Avatar -->
          <div class="relative z-10 w-8 h-8 rounded-full ${
            isEgress
              ? 'bg-rose-600 border-2 border-white shadow-md shadow-rose-900/40'
              : 'bg-emerald-600 border-2 border-white shadow-md shadow-emerald-900/30'
          } flex items-center justify-center text-white font-bold text-xs font-sans">
            ${initials}
          </div>

          <!-- Name Pill -->
          <div class="relative z-10 -mt-1 px-2 py-0.5 rounded-full ${
            isEgress
              ? 'bg-rose-600 text-white border border-rose-400'
              : 'bg-slate-900 text-white border border-slate-700'
          } text-[9px] font-bold font-mono whitespace-nowrap shadow-xs">
            ${presence.name.split(' ')[0]} (${presence.uhid})
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-resident-marker',
        html: residentHtml,
        iconSize: [80, 50],
        iconAnchor: [40, 25],
      });

      const marker = L.marker([rLat, rLng], { icon, zIndexOffset: 1000 });

      marker.on('click', () => {
        setSelectedPresence(presence);
        const z = activeFloor?.zones?.find((zn) => zn.id === presence.zoneId);
        if (z) setSelectedZone(z);
        setIsRoomDrawerOpen(true);
      });

      marker.bindTooltip(
        `
        <div class="text-xs p-1">
          <p class="font-bold text-white">${presence.name} (${presence.uhid})</p>
          <p class="text-[11px] text-slate-300">Zone: ${presence.zoneName || presence.roomNumber}</p>
          <p class="text-[10px] font-semibold ${isEgress ? 'text-rose-400' : 'text-emerald-400'}">
            ${isEgress ? '⚠️ Restricted Area Breach!' : '✓ Safe Perimeter'}
          </p>
        </div>
        `,
        { direction: 'top', className: 'leaflet-custom-tooltip' },
      );

      residentGroup.addLayer(marker);
    });
  }, [floorPresence, showResidents, activeFloor, getRoomLatLng]);

  // Fit view (Zero-scroll reset)
  const handleFitFloor = () => {
    if (!mapInstanceRef.current) return;
    const bounds: L.LatLngBoundsLiteral = [
      [0, 0],
      [currentFloorPlan.height, currentFloorPlan.width],
    ];
    mapInstanceRef.current.fitBounds(bounds, { padding: [16, 16], maxZoom: 1 });
  };

  return (
    <div className="flex flex-col h-full w-full space-y-2">
      {/* Alert Banner for Egress Breach */}
      {alertBanner && (
        <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-md flex items-center justify-between gap-3 animate-shake shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-300 animate-bounce shrink-0" />
            <p className="text-xs font-bold">{alertBanner}</p>
          </div>
          <button
            onClick={() => setAlertBanner(null)}
            className="px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Streamlined Top HUD Control Bar */}
      <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left: Floor Selector & Metrics */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedFloorNumber}
              onChange={(e) => {
                setSelectedFloorNumber(Number(e.target.value));
                setSelectedZone(null);
                setSelectedPresence(null);
              }}
              aria-label="Select Floor"
              className="appearance-none pl-8 pr-8 py-1.5 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-2xs hover:border-emerald-500 focus:outline-hidden cursor-pointer transition"
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

          <div className="hidden sm:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <Users className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                <strong className="text-slate-900 dark:text-white">{floorPresence.length}</strong> Residents
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <Radio className="w-3.5 h-3.5 text-cyan-500" />
              <span>
                <strong className="text-slate-900 dark:text-white">
                  {activeFloor?.zones?.reduce((acc, z) => acc + (z.beacons?.length || 1), 0) ?? 0}
                </strong>{' '}
                Beacons
              </span>
            </div>

            <div
              className={`flex items-center gap-1.5 font-semibold ${
                hasBreachOnFloor ? 'text-rose-500' : 'text-emerald-500'
              }`}
            >
              {hasBreachOnFloor ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Egress Breach</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>100% Safe Perimeter</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Layer Toggles & Map Controls */}
        <div className="flex items-center gap-2">
          {/* Toggles */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setShowBeacons(!showBeacons)}
              title="Toggle BLE Beacons"
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer ${
                showBeacons
                  ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Radio className="w-3 h-3" />
              <span>Beacons</span>
            </button>
            <button
              onClick={() => setShowResidents(!showResidents)}
              title="Toggle Residents"
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer ${
                showResidents
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Residents</span>
            </button>
          </div>

          {/* Pan / Zoom Control Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => mapInstanceRef.current?.zoomIn()}
              title="Zoom In"
              className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => mapInstanceRef.current?.zoomOut()}
              title="Zoom Out"
              className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleFitFloor}
              title="Fit Entire Floor to Screen"
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Fit Floor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Full-Height Leaflet Blueprint Viewport (Zero Scroll, Pure Clean Floor Plan) */}
      <div className="flex-1 min-h-[480px] w-full bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden relative isolate z-0">
        <div ref={mapContainerRef} className="w-full h-full select-none" />

        {/* Minimalist Floating HUD Legend */}
        <div className="absolute bottom-3 left-3 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-md flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            BLE Beacon
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Safe Zone
          </span>
          <span className="flex items-center gap-1 text-rose-500 font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            Egress Breach
          </span>
          <span className="hidden sm:inline text-slate-400 font-mono text-[10px]">
            &bull; Drag to pan, scroll to zoom
          </span>
        </div>
      </div>

      {/* Slide-over Room Detail Drawer */}
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

      {/* Floating Action Button (FAB): Facility Movement & Geofence Simulation */}
      <button
        onClick={() => setIsSimulationOpen(true)}
        aria-label="Simulate Facility Movement & Geofence"
        title="Simulate Facility Movement & Geofence"
        className="fixed bottom-6 right-6 z-[500] w-12 h-12 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center justify-center shadow-xl shadow-emerald-950/25 dark:shadow-emerald-950/50 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-emerald-400/30 group"
      >
        <Zap className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
      </button>

      {/* Facility Movement & Geofence Simulation Modal (Locked to Movement Alone) */}
      <SimulationModal
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        lockedTab="movement"
        floors={floors}
        onMovementSimulated={async () => {
          await loadData();
          onMovementSimulated?.();
        }}
      />
    </div>
  );
};
