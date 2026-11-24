import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Radio,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Users,
  Compass,
  Layers,
  ChevronDown,
  Video,
  Activity,
  Globe,
  Grid,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import { Floor, RoomZone, ResidentPresence, FacilityGeoJson } from '../../types';
import commandCenterService from '../../services/commandCenterService';
import { FACILITY_GEO_ANCHOR, pixelToGeo, rectToGeoPolygon } from '../../utils/facilityGeo';
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
  const [geoJsonData, setGeoJsonData] = useState<FacilityGeoJson | null>(null);
  const [selectedFloorNumber, setSelectedFloorNumber] = useState<number>(2);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedZone, setSelectedZone] = useState<RoomZone | null>(null);
  const [selectedPresence, setSelectedPresence] = useState<ResidentPresence | null>(null);
  const [isRoomDrawerOpen, setIsRoomDrawerOpen] = useState(false);
  const [simulatingMove, setSimulatingMove] = useState(false);
  const [alertBanner, setAlertBanner] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'osm' | 'blueprint'>('osm');

  // Leaflet refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [floorsRes, presenceRes, geoJsonRes] = await Promise.all([
        commandCenterService.getFacilityFloors(),
        commandCenterService.getFacilityPresence(),
        commandCenterService.getFacilityGeoJson(selectedFloorNumber),
      ]);
      setFloors(floorsRes);
      setPresenceList(presenceRes);
      if (geoJsonRes) setGeoJsonData(geoJsonRes);

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

  const handleSimulateMovement = async (residentId: number, targetZoneId: number) => {
    setSimulatingMove(true);
    try {
      const res = await commandCenterService.simulateResidentMovement(residentId, targetZoneId);
      if (res.alertTriggered) {
        setAlertBanner(res.message);
      } else {
        setAlertBanner(null);
      }
      await loadData();
    } catch (err) {
      console.error('Failed to simulate movement:', err);
    } finally {
      setSimulatingMove(false);
    }
  };

  // Color mapping helper for zones
  const getZoneColor = (zoneType: string, isSafe: boolean) => {
    if (!isSafe) {
      return { stroke: '#ef4444', fill: '#f87171', fillOpacity: 0.35, isRestricted: true };
    }
    switch (zoneType) {
      case 'suite':
        return { stroke: '#64748b', fill: '#94a3b8', fillOpacity: 0.2, isRestricted: false };
      case 'garden':
        return { stroke: '#10b981', fill: '#34d399', fillOpacity: 0.35, isRestricted: false };
      case 'calming':
        return { stroke: '#8b5cf6', fill: '#a78bfa', fillOpacity: 0.3, isRestricted: false };
      case 'dining':
        return { stroke: '#f59e0b', fill: '#fbbf24', fillOpacity: 0.25, isRestricted: false };
      case 'therapy':
        return { stroke: '#06b6d4', fill: '#22d3ee', fillOpacity: 0.25, isRestricted: false };
      case 'staff':
        return { stroke: '#3b82f6', fill: '#60a5fa', fillOpacity: 0.25, isRestricted: false };
      case 'corridor':
        return { stroke: '#94a3b8', fill: '#cbd5e1', fillOpacity: 0.15, isRestricted: false };
      default:
        return { stroke: '#64748b', fill: '#94a3b8', fillOpacity: 0.2, isRestricted: false };
    }
  };

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

  // ==========================================
  // Leaflet Map Initialization & Rendering
  // ==========================================
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [FACILITY_GEO_ANCHOR.lat, FACILITY_GEO_ANCHOR.lng],
        zoom: 19,
        minZoom: 17,
        maxZoom: 22,
        zoomControl: true,
      });

      // CartoDB Voyager Tiles (clean, crisp, architectural contrast)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 22,
        subdomains: 'abcd',
      }).addTo(map);

      // Building Footprint Perimeter Polygon
      const outerPoly = [
        [rectToGeoPolygon(15, 15, 970, 570).map(([lng, lat]) => [lat, lng])],
      ];
      L.polygon(outerPoly as any, {
        color: '#0ea5e9',
        weight: 2,
        fillColor: '#38bdf8',
        fillOpacity: 0.04,
        dashArray: '4, 4',
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      leafletMapRef.current = map;
    }

    // Leaflet needs invalidateSize when viewMode changes or tab switches
    const timeout = setTimeout(() => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [viewMode]);

  // Update Leaflet indoor layers & resident markers when state changes
  useEffect(() => {
    if (!leafletMapRef.current || viewMode !== 'osm') return;

    const map = leafletMapRef.current;

    // Remove existing GeoJSON layer
    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
      geojsonLayerRef.current = null;
    }

    // Clear markers layer
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    }

    // Build GeoJSON Feature Collection dynamically from activeFloor and/or geoJsonData
    const currentGeoFeatures: any[] = [];
    const existingZoneIds = new Set<number>();

    // 1. First, include any features from geoJsonData for the selected floor
    if (geoJsonData && geoJsonData.features && geoJsonData.features.length > 0) {
      const levelFeatures = geoJsonData.features.filter(
        (f) => f.properties?.level === selectedFloorNumber,
      );
      for (const f of levelFeatures) {
        if (f.properties?.zoneId) {
          existingZoneIds.add(Number(f.properties.zoneId));
        }
        currentGeoFeatures.push(f);
      }
    }

    // 2. Ensure every zone on activeFloor is represented (catches newly added rooms)
    if (activeFloor && activeFloor.zones && activeFloor.zones.length > 0) {
      const layoutW = Number(activeFloor.layoutWidth || 1000);
      const layoutH = Number(activeFloor.layoutHeight || 600);

      for (const zone of activeFloor.zones) {
        if (!existingZoneIds.has(Number(zone.id))) {
          const zX = Number(zone.x ?? 40);
          const zY = Number(zone.y ?? 40);
          const zW = Number(zone.width ?? 160);
          const zH = Number(zone.height ?? 140);

          const poly = rectToGeoPolygon(zX, zY, zW, zH, layoutW, layoutH);
          const center = pixelToGeo(zX + zW / 2, zY + zH / 2, layoutW, layoutH);

          currentGeoFeatures.push({
            type: 'Feature',
            id: `zone-${zone.id}`,
            geometry: {
              type: 'Polygon',
              coordinates: [poly],
            },
            properties: {
              indoor: zone.zoneType === 'corridor' ? 'corridor' : 'room',
              level: activeFloor.floorNumber,
              floorId: activeFloor.id,
              floorName: activeFloor.name,
              zoneId: zone.id,
              ref: zone.roomNumber,
              name: zone.name,
              zoneType: zone.zoneType,
              isSafePerimeter: zone.isSafePerimeter,
              maxCapacity: zone.maxCapacity,
              centerLat: center.lat,
              centerLng: center.lng,
              currentResident: zone.currentResident
                ? {
                    id: zone.currentResident.id,
                    name: `${zone.currentResident.firstName} ${zone.currentResident.lastName}`,
                    uhid: zone.currentResident.uhid,
                  }
                : null,
              beaconsCount: (zone.beacons || []).length,
            },
          });
          existingZoneIds.add(Number(zone.id));
        }
      }
    }

    // Add GeoJSON Zone Polygons to Leaflet
    const geoLayer = L.geoJSON(
      { type: 'FeatureCollection', features: currentGeoFeatures } as any,
      {
        filter: (feature) => feature.properties.indoor !== 'beacon',
        style: (feature) => {
          if (!feature) return {};
          const props = feature.properties;
          const colors = getZoneColor(props.zoneType, props.isSafePerimeter);
          const isSelected = selectedZone?.id === props.zoneId;

          return {
            color: isSelected ? '#06b6d4' : colors.stroke,
            weight: isSelected ? 3 : 1.5,
            fillColor: colors.fill,
            fillOpacity: isSelected ? 0.45 : colors.fillOpacity,
            dashArray: colors.isRestricted ? '5, 5' : undefined,
          };
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties;

          // Tooltip on hover
          layer.bindTooltip(
            `<b>Room ${props.ref}</b>: ${props.name}<br/><span style="font-size:10px;text-transform:uppercase;color:${
              props.isSafePerimeter ? '#10b981' : '#ef4444'
            }">${props.isSafePerimeter ? '✓ Safe Perimeter' : '🚨 Restricted Egress'}</span>`,
            { direction: 'top', sticky: true, className: 'leaflet-custom-tooltip' },
          );

          // Click handler to select room zone
          layer.on({
            click: () => {
              const zone = activeFloor?.zones?.find((z) => z.id === props.zoneId);
              if (zone) {
                setSelectedZone(zone);
                const p = presenceList.find((pr) => pr.zoneId === zone.id);
                setSelectedPresence(p || null);
                setIsRoomDrawerOpen(true);
              }
            },
          });
        },
      },
    ).addTo(map);

    geojsonLayerRef.current = geoLayer;

    // Add BLE Beacon Anchor Markers
    if (activeFloor?.zones && markersLayerRef.current) {
      const layoutW = Number(activeFloor.layoutWidth || 1000);
      const layoutH = Number(activeFloor.layoutHeight || 600);
      activeFloor.zones.forEach((z) => {
        const zX = Number(z.x ?? 40);
        const zY = Number(z.y ?? 40);
        const zW = Number(z.width ?? 160);
        const center = pixelToGeo(zX + zW - 20, zY + 20, layoutW, layoutH);
        const beaconSerial = z.beacons?.[0]?.serialNumber || `BCN-FL${selectedFloorNumber}-${z.roomNumber}`;

        const beaconIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center cursor-pointer group" title="BLE Anchor: ${beaconSerial}">
              <div class="w-3 h-3 rounded-full bg-cyan-400 border-2 border-white shadow-xs"></div>
              <div class="absolute w-5 h-5 rounded-full border border-cyan-400/60 animate-ping"></div>
            </div>
          `,
          className: 'custom-beacon-marker',
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });

        const bMarker = L.marker([center.lat, center.lng], { icon: beaconIcon });
        bMarker.bindTooltip(
          `<b>Beacon Anchor</b>: ${beaconSerial}<br/><span style="font-size:10px;color:#06b6d4">Tx: 5Hz &bull; Battery 98%</span>`,
          { direction: 'bottom' },
        );
        bMarker.addTo(markersLayerRef.current!);
      });
    }

    // Add Resident Live Presence Markers with rich Tailwind DivIcon
    if (markersLayerRef.current) {
      const layoutW = Number(activeFloor?.layoutWidth || 1000);
      const layoutH = Number(activeFloor?.layoutHeight || 600);
      floorPresence.forEach((presence) => {
        const posX = Number(presence.x || 100);
        const posY = Number(presence.y || 100);
        const pLat = presence.lat || pixelToGeo(posX, posY, layoutW, layoutH).lat;
        const pLng = presence.lng || pixelToGeo(posX, posY, layoutW, layoutH).lng;
        const isEgress = !presence.isSafePerimeter;
        const initials = presence.name
          .split(' ')
          .map((n) => n[0])
          .join('');
        const firstName = presence.name.split(' ')[0];

        const residentIcon = L.divIcon({
          html: `
            <div class="relative flex flex-col items-center cursor-pointer group -translate-x-1/2 -translate-y-1/2">
              <!-- Pulsing aura ring -->
              <div class="absolute -inset-2 rounded-full ${
                isEgress ? 'bg-rose-500/40 animate-ping' : 'bg-emerald-500/30 animate-pulse'
              }"></div>
              <!-- Avatar circle -->
              <div class="relative w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] text-white shadow-lg ${
                isEgress ? 'bg-rose-600 ring-2 ring-white' : 'bg-emerald-600 ring-2 ring-white dark:ring-slate-900'
              }">
                ${initials}
              </div>
              <!-- Floating name & UHID pill -->
              <div class="mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow-md whitespace-nowrap ${
                isEgress ? 'bg-rose-600 text-white' : 'bg-slate-900/90 text-white dark:bg-white dark:text-slate-900'
              }">
                ${firstName} (${presence.uhid})
              </div>
            </div>
          `,
          className: 'custom-resident-marker',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const rMarker = L.marker([pLat, pLng], { icon: residentIcon });
        rMarker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedPresence(presence);
          const z = activeFloor?.zones.find((zn) => zn.id === presence.zoneId);
          if (z) setSelectedZone(z);
        });
        rMarker.addTo(markersLayerRef.current!);
      });
    }

    // If a target zone was requested, smoothly pan to it
    if (selectedZone) {
      const zCenter = pixelToGeo(
        selectedZone.x + selectedZone.width / 2,
        selectedZone.y + selectedZone.height / 2,
      );
      map.flyTo([zCenter.lat, zCenter.lng], 19, { duration: 1.0 });
    }
  }, [viewMode, selectedFloorNumber, presenceList, geoJsonData, selectedZone, activeFloor]);

  const handleRecenter = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo(
        [FACILITY_GEO_ANCHOR.lat, FACILITY_GEO_ANCHOR.lng],
        19,
        { duration: 0.8 },
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Tagline Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <MapPin className="w-6 h-6 text-cyan-500 dark:text-cyan-400" />
            <span>Facility Map</span>
            <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              OpenStreetMap Indoor SIT
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            2-Floor interactive BLE micro-location topology, memory care safe-zones, and resident tracking
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

      {/* Main Interactive Map & Controls Container */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Top Controls Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mr-1">
              <MapPin className="w-5 h-5 text-emerald-500" />
              <span>Facility Map</span>
            </h2>

            {/* Quick Floor Switch Pills */}
            {floors.length > 0 && (
              <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                {floors.map((f) => {
                  const isActive = f.floorNumber === selectedFloorNumber;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setSelectedFloorNumber(f.floorNumber);
                        setSelectedZone(null);
                        setSelectedPresence(null);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Floor {f.floorNumber}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle (OSM Map vs Blueprint) */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('osm')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'osm'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>OSM Indoor</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('blueprint')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'blueprint'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Vector Blueprint</span>
              </button>
            </div>

            {/* Recenter Button (visible in OSM mode) */}
            {viewMode === 'osm' && (
              <button
                type="button"
                onClick={handleRecenter}
                title="Recenter Facility View"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Center</span>
              </button>
            )}

            {/* Refresh Button */}
            <button
              type="button"
              onClick={loadData}
              title="Refresh Facility Map & Devices"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Floor Switcher Dropdown */}
            <div className="relative">
              <select
                value={selectedFloorNumber}
                onChange={(e) => {
                  setSelectedFloorNumber(Number(e.target.value));
                  setSelectedZone(null);
                  setSelectedPresence(null);
                }}
                className="appearance-none pl-8 pr-8 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-xs focus:outline-hidden focus:border-emerald-500 cursor-pointer transition"
              >
                {floors.map((f) => (
                  <option key={f.id} value={f.floorNumber}>
                    Floor {f.floorNumber}: {f.name} ({f.zones?.length || 0} rooms)
                  </option>
                ))}
              </select>
              <Layers className="w-3.5 h-3.5 text-emerald-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Quick Simulation Dropdown */}
            <div className="relative">
              <select
                defaultValue=""
                disabled={simulatingMove}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const [rId, zId] = e.target.value.split(':').map(Number);
                  handleSimulateMovement(rId, zId);
                  e.target.value = '';
                }}
                className="appearance-none pl-8 pr-8 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-xs focus:outline-hidden focus:border-cyan-500 cursor-pointer transition"
              >
                <option value="" disabled>⚡ Test Movement &amp; Geofence</option>
                <option value="2:214">🚨 Move Eleanor to Fire Stairwell B (Trigger Egress Alert!)</option>
                <option value="2:204">✓ Return Eleanor to Suite 204 (Safe Baseline)</option>
                <option value="3:206">🌿 Move Marcus to Snoezelen Calming Lounge</option>
                <option value="1:106">🌳 Move Alex to Sensory Garden (Ground Floor)</option>
              </select>
              <Compass className="w-3.5 h-3.5 text-amber-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 1. Leaflet OpenStreetMap Engine View */}
        <div
          style={{ display: viewMode === 'osm' ? 'block' : 'none' }}
          className="relative border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner"
        >
          <div
            ref={mapContainerRef}
            className="w-full h-[520px] z-0"
            style={{ background: '#f8fafc' }}
          />

          {/* Map Overlay Badge */}
          <div className="absolute bottom-3 left-3 z-1000 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Brookline Care Campus
            </span>
            <span className="text-slate-400 font-mono text-[10px]">
              ({FACILITY_GEO_ANCHOR.lat.toFixed(4)}° N, {Math.abs(FACILITY_GEO_ANCHOR.lng).toFixed(4)}° W)
            </span>
          </div>
        </div>

        {/* 2. Vector Blueprint Canvas View */}
        <div
          style={{ display: viewMode === 'blueprint' ? 'block' : 'none' }}
          className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/50 relative"
        >
          <div className="w-full aspect-16/10 max-h-[520px] flex items-center justify-center p-2 sm:p-4">
            <svg
              viewBox="0 0 1000 600"
              className="w-full h-full select-none"
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
              <rect width="1000" height="600" fill="url(#archGrid)" />

              {/* Perimeter Building Outer Wall */}
              <rect
                x="20"
                y="20"
                width="960"
                height="560"
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

        {/* Room Detail Drawer (Right-Hand Slide-Over like in Resident Profile) */}
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
            Auto-refreshed via continuous Kalman RSSI smoothing
          </div>
        </div>
      </div>
    </div>
  );
};
