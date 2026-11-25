import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Floor } from './entities/floor.entity';
import { RoomZone, ZoneType } from './entities/room-zone.entity';
import { Beacon } from './entities/beacon.entity';
import { Resident } from '../residents/entities/resident.entity';
import {
  Notification,
  NotificationType,
  NotificationPriority,
} from '../notifications/entities/notification.entity';
import { CreateFloorDto, UpdateFloorDto } from './dtos/floor.dto';
import { CreateRoomZoneDto, UpdateRoomZoneDto } from './dtos/room-zone.dto';
import { CreateBeaconDto, UpdateBeaconDto } from './dtos/beacon.dto';

// Geographic anchor for careMP Sentinel Facility (Infopark Kochi, Kakkanad, Kerala, India)
export const FACILITY_GEO_ANCHOR = {
  lat: 10.0105,
  lng: 76.3631,
  widthMeters: 60,
  heightMeters: 36,
  degLatPerMeter: 1 / 111111,
  degLngPerMeter: 1 / (111111 * Math.cos(10.0105 * (Math.PI / 180))),
};

export function pixelToGeo(x: number, y: number, layoutWidth = 1000, layoutHeight = 600) {
  const numX = Number(x) || 0;
  const numY = Number(y) || 0;
  const numLW = Number(layoutWidth) || 1000;
  const numLH = Number(layoutHeight) || 600;
  const normX = Math.max(0, Math.min(1, numX / numLW));
  const normY = Math.max(0, Math.min(1, numY / numLH));
  // Y goes downwards in SVG pixels (South in latitude):
  const lat = Number(
    (FACILITY_GEO_ANCHOR.lat + (0.5 - normY) * (FACILITY_GEO_ANCHOR.heightMeters * FACILITY_GEO_ANCHOR.degLatPerMeter)).toFixed(7),
  );
  // X goes rightwards in SVG pixels (East in longitude):
  const lng = Number(
    (FACILITY_GEO_ANCHOR.lng + (normX - 0.5) * (FACILITY_GEO_ANCHOR.widthMeters * FACILITY_GEO_ANCHOR.degLngPerMeter)).toFixed(7),
  );
  return { lat, lng };
}

export function rectToGeoPolygon(x: number, y: number, w: number, h: number, layoutWidth = 1000, layoutHeight = 600) {
  const numX = Number(x) || 0;
  const numY = Number(y) || 0;
  const numW = Number(w) || 160;
  const numH = Number(h) || 140;
  const numLW = Number(layoutWidth) || 1000;
  const numLH = Number(layoutHeight) || 600;

  const pTopLeft = pixelToGeo(numX, numY, numLW, numLH);
  const pTopRight = pixelToGeo(numX + numW, numY, numLW, numLH);
  const pBottomRight = pixelToGeo(numX + numW, numY + numH, numLW, numLH);
  const pBottomLeft = pixelToGeo(numX, numY + numH, numLW, numLH);

  // Standard GeoJSON coordinate order: [longitude, latitude]
  return [
    [pTopLeft.lng, pTopLeft.lat],
    [pTopRight.lng, pTopRight.lat],
    [pBottomRight.lng, pBottomRight.lat],
    [pBottomLeft.lng, pBottomLeft.lat],
    [pTopLeft.lng, pTopLeft.lat],
  ];
}

@Injectable()
export class FacilityService implements OnModuleInit {
  constructor(
    @InjectRepository(Floor)
    private readonly floorRepo: Repository<Floor>,

    @InjectRepository(RoomZone)
    private readonly zoneRepo: Repository<RoomZone>,

    @InjectRepository(Beacon)
    private readonly beaconRepo: Repository<Beacon>,

    @InjectRepository(Resident)
    private readonly residentRepo: Repository<Resident>,

    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async onModuleInit() {
    try {
      await this.ensureFacilitySeeded();
    } catch (err) {
      console.warn('Facility self-seed check deferred (table will be created by migrations):', err?.message);
    }
  }

  async ensureFacilitySeeded() {
    const floorCount = await this.floorRepo.count();
    if (floorCount > 0) return;

    console.info('🌱 Seeding 2-Floor Memory Care Indoor Topology & BLE Beacons...');

    // Load available residents for zone mapping
    const residents = await this.residentRepo.find({ take: 10 });
    const resMap: Record<string, Resident> = {};
    for (const r of residents) {
      resMap[r.uhid] = r;
    }

    // ==========================================
    // 1. FLOOR 1: Ground Level - Living, Dining & Garden
    // ==========================================
    const floor1 = this.floorRepo.create({
      floorNumber: 1,
      name: 'Ground Floor & Sensory Garden',
      code: 'FL-01',
      description: 'Community living, therapeutic sensory garden, dining hall, and reception.',
      layoutWidth: 1000,
      layoutHeight: 600,
      isActive: true,
    });
    const savedFloor1 = await this.floorRepo.save(floor1);

    const f1ZonesData: Array<{
      roomNumber: string;
      name: string;
      zoneType: ZoneType;
      isSafe: boolean;
      x: number;
      y: number;
      w: number;
      h: number;
      residentId?: number | null;
      desc: string;
      beaconMac: string;
    }> = [
      {
        roomNumber: '101',
        name: 'Welcome Foyer & Reception',
        zoneType: 'common',
        isSafe: true,
        x: 40,
        y: 40,
        w: 200,
        h: 160,
        desc: 'Visitor check-in & main reception desk.',
        beaconMac: 'E4:95:6E:01:01:01',
      },
      {
        roomNumber: '102',
        name: 'Central Dining & Nutrition Hall',
        zoneType: 'dining',
        isSafe: true,
        x: 260,
        y: 40,
        w: 340,
        h: 240,
        desc: 'Communal dining and scheduled hydration point.',
        beaconMac: 'E4:95:6E:01:01:02',
      },
      {
        roomNumber: '103',
        name: 'Community Lounge & Music Room',
        zoneType: 'common',
        isSafe: true,
        x: 620,
        y: 40,
        w: 340,
        h: 240,
        residentId: resMap['RES-004']?.id || null,
        desc: 'Relaxation lounge with acoustic resonance therapy.',
        beaconMac: 'E4:95:6E:01:01:03',
      },
      {
        roomNumber: '104',
        name: 'Ground Security & Dispatch Post',
        zoneType: 'staff',
        isSafe: true,
        x: 40,
        y: 220,
        w: 200,
        h: 160,
        desc: 'Staff security monitoring & first-response gear.',
        beaconMac: 'E4:95:6E:01:01:04',
      },
      {
        roomNumber: '105',
        name: 'Garden Promenade Corridor',
        zoneType: 'corridor',
        isSafe: true,
        x: 260,
        y: 300,
        w: 700,
        h: 80,
        desc: 'Wide non-slip transition gallery with wayfinding beacons.',
        beaconMac: 'E4:95:6E:01:01:05',
      },
      {
        roomNumber: '106',
        name: 'Therapeutic Sensory Garden & Patio',
        zoneType: 'garden',
        isSafe: true,
        x: 40,
        y: 400,
        w: 560,
        h: 160,
        residentId: resMap['RES-001']?.id || null,
        desc: 'Safe enclosed outdoor garden with tactile herb paths.',
        beaconMac: 'E4:95:6E:01:01:06',
      },
      {
        roomNumber: '107',
        name: 'Physiotherapy & Cadence Studio',
        zoneType: 'therapy',
        isSafe: true,
        x: 620,
        y: 400,
        w: 220,
        h: 160,
        desc: 'Locomotion training and gait analysis equipment.',
        beaconMac: 'E4:95:6E:01:01:07',
      },
      {
        roomNumber: '108',
        name: 'Exterior Main Gate (Restricted)',
        zoneType: 'restricted',
        isSafe: false,
        x: 860,
        y: 400,
        w: 100,
        h: 160,
        desc: 'Restricted perimeter exit with anti-wandering lock.',
        beaconMac: 'E4:95:6E:01:01:08',
      },
    ];

    for (const zd of f1ZonesData) {
      const z = this.zoneRepo.create({
        floorId: savedFloor1.id,
        roomNumber: zd.roomNumber,
        name: zd.name,
        zoneType: zd.zoneType,
        isSafePerimeter: zd.isSafe,
        x: zd.x,
        y: zd.y,
        width: zd.w,
        height: zd.h,
        currentResidentId: zd.residentId || null,
        description: zd.desc,
      });
      const savedZ = await this.zoneRepo.save(z);

      const beacon = this.beaconRepo.create({
        zoneId: savedZ.id,
        serialNumber: `BCN-FL1-${zd.roomNumber}`,
        macAddress: zd.beaconMac,
        major: 1001,
        minor: parseInt(zd.roomNumber, 10),
        rssiCalibrated1m: -59,
        batteryLevel: 98.0,
        status: 'active',
        txIntervalHz: 5,
        lastHeartbeatAt: new Date(),
      });
      await this.beaconRepo.save(beacon);
    }

    // ==========================================
    // 2. FLOOR 2: Level 2 - Memory Care Suites & Telemetry
    // ==========================================
    const floor2 = this.floorRepo.create({
      floorNumber: 2,
      name: 'Floor 2: Memory Care Suites & Telemetry Desk',
      code: 'FL-02',
      description: 'Private memory care suites 201–212, central telemetry station, and sensory calming lounge.',
      layoutWidth: 1000,
      layoutHeight: 600,
      isActive: true,
    });
    const savedFloor2 = await this.floorRepo.save(floor2);

    const f2ZonesData: Array<{
      roomNumber: string;
      name: string;
      zoneType: ZoneType;
      isSafe: boolean;
      x: number;
      y: number;
      w: number;
      h: number;
      residentId?: number | null;
      desc: string;
      beaconMac: string;
    }> = [
      {
        roomNumber: '201',
        name: 'Suite 201 (Private Room)',
        zoneType: 'suite',
        isSafe: true,
        x: 40,
        y: 40,
        w: 160,
        h: 160,
        desc: 'Single resident bedroom with mmWave radar cluster.',
        beaconMac: 'E4:95:6E:02:02:01',
      },
      {
        roomNumber: '202',
        name: 'Suite 202 (Private Room)',
        zoneType: 'suite',
        isSafe: true,
        x: 220,
        y: 40,
        w: 160,
        h: 160,
        desc: 'Single resident memory care suite.',
        beaconMac: 'E4:95:6E:02:02:02',
      },
      {
        roomNumber: '203',
        name: 'Suite 203 (Private Room)',
        zoneType: 'suite',
        isSafe: true,
        x: 400,
        y: 40,
        w: 160,
        h: 160,
        desc: 'Single resident memory care suite.',
        beaconMac: 'E4:95:6E:02:02:03',
      },
      {
        roomNumber: '204',
        name: 'Suite 204 (Eleanor Vance - En-Suite)',
        zoneType: 'suite',
        isSafe: true,
        x: 580,
        y: 40,
        w: 180,
        h: 160,
        residentId: resMap['RES-002']?.id || null,
        desc: 'Memory Suite 204. Monitored for nocturnal dipping & fall mitigation.',
        beaconMac: 'E4:95:6E:02:02:04',
      },
      {
        roomNumber: '205',
        name: 'Suite 205 (Private Room)',
        zoneType: 'suite',
        isSafe: true,
        x: 780,
        y: 40,
        w: 180,
        h: 160,
        desc: 'Single resident memory care suite.',
        beaconMac: 'E4:95:6E:02:02:05',
      },
      {
        roomNumber: '200A',
        name: 'North Memory Corridor Gallery',
        zoneType: 'corridor',
        isSafe: true,
        x: 40,
        y: 220,
        w: 920,
        h: 70,
        desc: 'Continuous corridor with circadian color-temperature illumination.',
        beaconMac: 'E4:95:6E:02:02:00',
      },
      {
        roomNumber: '200B',
        name: 'Central Acute Telemetry Desk',
        zoneType: 'staff',
        isSafe: true,
        x: 360,
        y: 310,
        w: 280,
        h: 140,
        desc: 'Central Command Center workstation for attending nurses.',
        beaconMac: 'E4:95:6E:02:02:99',
      },
      {
        roomNumber: '206',
        name: 'Snoezelen Sensory Calming Lounge',
        zoneType: 'calming',
        isSafe: true,
        x: 40,
        y: 310,
        w: 160,
        h: 140,
        desc: 'Multisensory de-escalation room for sundowning agitation.',
        beaconMac: 'E4:95:6E:02:02:06',
      },
      {
        roomNumber: '207',
        name: 'Suite 207 (Private Room)',
        zoneType: 'suite',
        isSafe: true,
        x: 220,
        y: 310,
        w: 120,
        h: 140,
        desc: 'Single resident memory care suite.',
        beaconMac: 'E4:95:6E:02:02:07',
      },
      {
        roomNumber: '208',
        name: 'Suite 208 (Lewy Body Suite)',
        zoneType: 'suite',
        isSafe: true,
        x: 660,
        y: 310,
        w: 140,
        h: 140,
        desc: 'Resident suite with low-height beds and fall mats.',
        beaconMac: 'E4:95:6E:02:02:08',
      },
      {
        roomNumber: '209',
        name: 'Corridor 4B (Pacing Zone)',
        zoneType: 'corridor',
        isSafe: true,
        x: 820,
        y: 310,
        w: 140,
        h: 140,
        residentId: resMap['RES-003']?.id || null,
        desc: 'Pacing zone monitored for agitation micro-acceleration.',
        beaconMac: 'E4:95:6E:02:02:09',
      },
      {
        roomNumber: '210',
        name: 'Suite 210 (Private Room)',
        zoneType: 'suite',
        isSafe: true,
        x: 40,
        y: 470,
        w: 180,
        h: 100,
        desc: 'Single resident memory care suite.',
        beaconMac: 'E4:95:6E:02:02:10',
      },
      {
        roomNumber: '211',
        name: 'Suite 211 (Private Room)',
        zoneType: 'suite',
        isSafe: true,
        x: 240,
        y: 470,
        w: 180,
        h: 100,
        desc: 'Single resident memory care suite.',
        beaconMac: 'E4:95:6E:02:02:11',
      },
      {
        roomNumber: '212',
        name: 'Suite 212 (Private Room)',
        zoneType: 'suite',
        isSafe: true,
        x: 440,
        y: 470,
        w: 180,
        h: 100,
        desc: 'Single resident memory care suite.',
        beaconMac: 'E4:95:6E:02:02:12',
      },
      {
        roomNumber: '213',
        name: 'Quiet Reading Alcove',
        zoneType: 'common',
        isSafe: true,
        x: 640,
        y: 470,
        w: 200,
        h: 100,
        desc: 'Small quiet reading and photo-memory station.',
        beaconMac: 'E4:95:6E:02:02:13',
      },
      {
        roomNumber: '214',
        name: 'Fire Stairwell B (Restricted Egress)',
        zoneType: 'restricted',
        isSafe: false,
        x: 860,
        y: 470,
        w: 100,
        h: 100,
        desc: 'Restricted exit stairwell. Geofenced anti-wandering trigger.',
        beaconMac: 'E4:95:6E:02:02:14',
      },
    ];

    for (const zd of f2ZonesData) {
      const z = this.zoneRepo.create({
        floorId: savedFloor2.id,
        roomNumber: zd.roomNumber,
        name: zd.name,
        zoneType: zd.zoneType,
        isSafePerimeter: zd.isSafe,
        x: zd.x,
        y: zd.y,
        width: zd.w,
        height: zd.h,
        currentResidentId: zd.residentId || null,
        description: zd.desc,
      });
      const savedZ = await this.zoneRepo.save(z);

      const beacon = this.beaconRepo.create({
        zoneId: savedZ.id,
        serialNumber: `BCN-FL2-${zd.roomNumber}`,
        macAddress: zd.beaconMac,
        major: 1002,
        minor: parseInt(zd.roomNumber.replace(/\D/g, '') || '99', 10),
        rssiCalibrated1m: -59,
        batteryLevel: 97.4,
        status: 'active',
        txIntervalHz: 5,
        lastHeartbeatAt: new Date(),
      });
      await this.beaconRepo.save(beacon);
    }

    console.info('✅ Successfully seeded 2-floor facility topology and 24 BLE beacons.');
  }

  async getFloors() {
    try {
      await this.ensureFacilitySeeded();

      const floors = await this.floorRepo
        .createQueryBuilder('floor')
        .leftJoinAndSelect('floor.zones', 'zone')
        .leftJoinAndSelect('zone.currentResident', 'resident')
        .leftJoinAndSelect('zone.beacons', 'beacon')
        .orderBy('floor.floorNumber', 'ASC')
        .addOrderBy('zone.id', 'ASC')
        .getMany();

      if (floors && floors.length > 0) {
        return floors.map((f) => ({
          ...f,
          zones: (f.zones || []).map((z) => ({
            ...z,
            x: Number(z.x),
            y: Number(z.y),
            width: Number(z.width),
            height: Number(z.height),
            beacons: z.beacons || [],
          })),
        }));
      }
    } catch (err) {
      console.warn('Facility DB read failed, using verified in-memory fallback:', err?.message);
    }

    return this.getFallbackFloors();
  }

  async getPresence() {
    try {
      await this.ensureFacilitySeeded();

      const zonesWithResidents = await this.zoneRepo
        .createQueryBuilder('zone')
        .leftJoinAndSelect('zone.currentResident', 'resident')
        .leftJoinAndSelect('zone.floor', 'floor')
        .leftJoinAndSelect('zone.beacons', 'beacon')
        .where('zone.currentResidentId IS NOT NULL')
        .getMany();

      if (zonesWithResidents && zonesWithResidents.length > 0) {
        return zonesWithResidents
          .filter((z) => z.currentResident !== null)
          .map((z) => {
            const posX = Number(z.x) + Number(z.width) / 2;
            const posY = Number(z.y) + Number(z.height) / 2;
            const geo = pixelToGeo(posX, posY, z.floor?.layoutWidth || 1000, z.floor?.layoutHeight || 600);
            return {
              residentId: z.currentResident.id,
              uhid: z.currentResident.uhid,
              name: `${z.currentResident.firstName} ${z.currentResident.lastName}`,
              age: z.currentResident.age,
              floorNumber: z.floor?.floorNumber || 1,
              floorName: z.floor?.name || 'Main Floor',
              zoneId: z.id,
              roomNumber: z.roomNumber,
              zoneName: z.name,
              zoneType: z.zoneType,
              isSafePerimeter: z.isSafePerimeter,
              x: posX,
              y: posY,
              lat: geo.lat,
              lng: geo.lng,
              beaconId: z.beacons?.[0]?.serialNumber || 'BCN-ACTIVE',
              rssi: -62,
              dwellMinutes: 38,
              status: z.isSafePerimeter ? 'safe' : 'egress_alert',
            };
          });
      }
    } catch (err) {
      console.warn('Facility presence DB read failed, using fallback:', err?.message);
    }

    return this.getFallbackPresence();
  }

  async getFloorGeoJson(floorNumber?: number) {
    const floors = await this.getFloors();
    const targetFloors = floorNumber
      ? floors.filter((f) => f.floorNumber === Number(floorNumber))
      : floors;

    const features: any[] = [];

    for (const floor of targetFloors) {
      const layoutW = Number(floor.layoutWidth || 1000);
      const layoutH = Number(floor.layoutHeight || 600);

      for (const zone of (floor.zones || [])) {
        const zX = Number(zone.x ?? 40);
        const zY = Number(zone.y ?? 40);
        const zW = Number(zone.width ?? 160);
        const zH = Number(zone.height ?? 140);

        const polyCoords = rectToGeoPolygon(
          zX,
          zY,
          zW,
          zH,
          layoutW,
          layoutH,
        );
        const center = pixelToGeo(
          zX + zW / 2,
          zY + zH / 2,
          layoutW,
          layoutH,
        );

        // SIT (Simple Indoor Tagging) zone feature
        features.push({
          type: 'Feature',
          id: `zone-${zone.id}`,
          geometry: {
            type: 'Polygon',
            coordinates: [polyCoords],
          },
          properties: {
            indoor: zone.zoneType === 'corridor' ? 'corridor' : 'room',
            level: floor.floorNumber,
            floorId: floor.id,
            floorName: floor.name,
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

        // Beacon point features
        if (zone.beacons && zone.beacons.length > 0) {
          zone.beacons.forEach((b: any, idx: number) => {
            const bX = zX + (zW / (zone.beacons.length + 1)) * (idx + 1);
            const bY = zY + zH / 2;
            const bGeo = pixelToGeo(bX, bY, layoutW, layoutH);

            features.push({
              type: 'Feature',
              id: `beacon-${b.id || b.serialNumber}`,
              geometry: {
                type: 'Point',
                coordinates: [bGeo.lng, bGeo.lat],
              },
              properties: {
                indoor: 'beacon',
                level: floor.floorNumber,
                beaconId: b.id,
                serialNumber: b.serialNumber,
                macAddress: b.macAddress,
                batteryLevel: b.batteryLevel,
                zoneId: zone.id,
                roomNumber: zone.roomNumber,
                zoneName: zone.name,
                lat: bGeo.lat,
                lng: bGeo.lng,
              },
            });
          });
        }
      }
    }

    return {
      type: 'FeatureCollection',
      metadata: {
        facility: 'careMP Sentinel Campus (Infopark Kochi, India)',
        anchor: FACILITY_GEO_ANCHOR,
        activeLevel: floorNumber ? Number(floorNumber) : null,
        featureCount: features.length,
        generatedAt: new Date().toISOString(),
      },
      features,
    };
  }

  // ==========================================
  // Floors Management CRUD
  // ==========================================
  async getFloorById(id: number) {
    try {
      const floor = await this.floorRepo
        .createQueryBuilder('floor')
        .leftJoinAndSelect('floor.zones', 'zone')
        .where('floor.id = :id', { id })
        .getOne();
      if (floor) return floor;
    } catch (err) {
      console.warn('Floor DB find failed, checking fallback:', err?.message);
    }
    this.initFallbackDataIfNeeded();
    const fallback = this.fallbackFloors.find((f) => f.id === id);
    if (!fallback) throw new NotFoundException(`Floor #${id} not found`);
    return fallback;
  }

  async createFloor(dto: CreateFloorDto) {
    try {
      const floor = this.floorRepo.create({
        floorNumber: Number(dto.floorNumber),
        name: dto.name,
        code: dto.code || `FL-${Number(dto.floorNumber) < 10 ? '0' : ''}${dto.floorNumber}`,
        description: dto.description || '',
        layoutWidth: dto.layoutWidth ? Number(dto.layoutWidth) : 1000,
        layoutHeight: dto.layoutHeight ? Number(dto.layoutHeight) : 600,
        isActive: dto.isActive ?? true,
      });
      const saved = await this.floorRepo.save(floor);
      if (saved) {
        this.initFallbackDataIfNeeded();
        if (!this.fallbackFloors.some((f) => f.id === saved.id || f.floorNumber === saved.floorNumber)) {
          this.fallbackFloors.push({
            ...saved,
            zones: [],
          });
        }
        (saved as any).zones = [];
        return saved;
      }
    } catch (err) {
      console.warn('Floor DB create failed, saving to fallback:', err?.message);
    }
    this.initFallbackDataIfNeeded();
    const newId =
      this.fallbackFloors.length > 0
        ? Math.max(...this.fallbackFloors.map((f) => f.id)) + 1
        : 1;
    const newFloor = {
      id: newId,
      floorNumber: Number(dto.floorNumber),
      name: dto.name,
      code: dto.code || `FL-${Number(dto.floorNumber) < 10 ? '0' : ''}${dto.floorNumber}`,
      description: dto.description || '',
      layoutWidth: dto.layoutWidth ? Number(dto.layoutWidth) : 1000,
      layoutHeight: dto.layoutHeight ? Number(dto.layoutHeight) : 600,
      isActive: dto.isActive ?? true,
      zones: [],
    };
    this.fallbackFloors.push(newFloor);
    return newFloor;
  }

  async updateFloor(id: number, dto: UpdateFloorDto) {
    try {
      const floor = await this.floorRepo.findOne({ where: { id } });
      if (floor) {
        if (dto.floorNumber !== undefined) floor.floorNumber = Number(dto.floorNumber);
        if (dto.name !== undefined) floor.name = dto.name;
        if (dto.code !== undefined) floor.code = dto.code;
        if (dto.description !== undefined) floor.description = dto.description;
        if (dto.layoutWidth !== undefined) floor.layoutWidth = Number(dto.layoutWidth);
        if (dto.layoutHeight !== undefined) floor.layoutHeight = Number(dto.layoutHeight);
        if (dto.isActive !== undefined) floor.isActive = dto.isActive;
        return await this.floorRepo.save(floor);
      }
    } catch (err) {
      console.warn('Floor DB update failed, updating fallback:', err?.message);
    }
    this.initFallbackDataIfNeeded();
    const floor = this.fallbackFloors.find((f) => f.id === id);
    if (!floor) throw new NotFoundException(`Floor #${id} not found`);
    if (dto.floorNumber !== undefined) floor.floorNumber = Number(dto.floorNumber);
    if (dto.name !== undefined) floor.name = dto.name;
    if (dto.code !== undefined) floor.code = dto.code;
    if (dto.description !== undefined) floor.description = dto.description;
    if (dto.layoutWidth !== undefined) floor.layoutWidth = Number(dto.layoutWidth);
    if (dto.layoutHeight !== undefined) floor.layoutHeight = Number(dto.layoutHeight);
    if (dto.isActive !== undefined) floor.isActive = dto.isActive;
    return floor;
  }

  async deleteFloor(id: number) {
    try {
      await this.floorRepo.delete(id);
    } catch (err) {
      console.warn('Floor DB delete failed, removing from fallback:', err?.message);
    }
    this.initFallbackDataIfNeeded();
    this.fallbackFloors = this.fallbackFloors.filter((f) => f.id !== id);
    return { success: true, message: `Floor #${id} deleted successfully` };
  }

  // ==========================================
  // Room Zones Management CRUD
  // ==========================================
  async getZones(floorId?: number) {
    try {
      let qb = this.zoneRepo
        .createQueryBuilder('zone')
        .leftJoinAndSelect('zone.floor', 'floor')
        .leftJoinAndSelect('zone.currentResident', 'resident')
        .leftJoinAndSelect('zone.beacons', 'beacon')
        .orderBy('zone.id', 'ASC');

      if (floorId) {
        qb = qb.where('zone.floorId = :floorId OR floor.floorNumber = :floorId', { floorId });
      }
      const zones = await qb.getMany();
      if (zones && zones.length > 0) return zones;
    } catch (err) {
      console.warn('Zone DB read failed, using fallback:', err?.message);
    }
    this.initFallbackDataIfNeeded();
    const allZones: any[] = [];
    for (const f of this.fallbackFloors) {
      if (!floorId || f.id === floorId || f.floorNumber === floorId) {
        for (const z of (f.zones || [])) {
          allZones.push({
            ...z,
            floor: { id: f.id, floorNumber: f.floorNumber, name: f.name, code: f.code },
          });
        }
      }
    }
    return allZones;
  }

  async getZoneById(id: number) {
    try {
      const zone = await this.zoneRepo
        .createQueryBuilder('zone')
        .leftJoinAndSelect('zone.floor', 'floor')
        .leftJoinAndSelect('zone.currentResident', 'resident')
        .leftJoinAndSelect('zone.beacons', 'beacon')
        .where('zone.id = :id', { id })
        .getOne();
      if (zone) return zone;
    } catch (err) {
      console.warn('Zone DB find failed, checking fallback:', err?.message);
    }
    this.initFallbackDataIfNeeded();
    for (const f of this.fallbackFloors) {
      const z = f.zones.find((zone: any) => zone.id === id);
      if (z) return { ...z, floor: { id: f.id, floorNumber: f.floorNumber, name: f.name } };
    }
    throw new NotFoundException(`Room Zone #${id} not found`);
  }

  async createZone(dto: CreateRoomZoneDto) {
    try {
      // Find floor record to resolve valid foreign key
      let floorRecord = await this.floorRepo.findOne({
        where: [{ id: Number(dto.floorId) }, { floorNumber: Number(dto.floorId) }],
      });

      const zone = this.zoneRepo.create({
        floorId: floorRecord ? floorRecord.id : Number(dto.floorId),
        roomNumber: dto.roomNumber,
        name: dto.name,
        zoneType: dto.zoneType || 'suite',
        isSafePerimeter: dto.isSafePerimeter ?? true,
        x: dto.x !== undefined ? Number(dto.x) : 40,
        y: dto.y !== undefined ? Number(dto.y) : 40,
        width: dto.width !== undefined ? Number(dto.width) : 160,
        height: dto.height !== undefined ? Number(dto.height) : 140,
        maxCapacity: dto.maxCapacity !== undefined ? Number(dto.maxCapacity) : 1,
        description: dto.description || '',
      });
      const saved = await this.zoneRepo.save(zone);
      if (saved) {
        this.initFallbackDataIfNeeded();
        const f = this.fallbackFloors.find(
          (fl) => fl.id === Number(dto.floorId) || fl.floorNumber === Number(dto.floorId) || (floorRecord && fl.id === floorRecord.id),
        );
        if (f) {
          if (!f.zones) f.zones = [];
          if (!f.zones.some((z: any) => z.id === saved.id)) {
            f.zones.push({
              ...saved,
              x: Number(saved.x),
              y: Number(saved.y),
              width: Number(saved.width),
              height: Number(saved.height),
              currentResident: null,
              beacons: [],
            });
          }
        }
        return saved;
      }
    } catch (err) {
      console.warn('Zone DB create failed, saving to fallback:', err?.message);
    }
    this.initFallbackDataIfNeeded();
    const floor = this.fallbackFloors.find(
      (f) => f.id === Number(dto.floorId) || f.floorNumber === Number(dto.floorId),
    );
    const newId = 1000 + Math.floor(Math.random() * 9000);
    const newZone = {
      id: newId,
      floorId: floor ? floor.id : Number(dto.floorId),
      roomNumber: dto.roomNumber,
      name: dto.name,
      zoneType: dto.zoneType || 'suite',
      isSafePerimeter: dto.isSafePerimeter ?? true,
      x: dto.x !== undefined ? Number(dto.x) : 40,
      y: dto.y !== undefined ? Number(dto.y) : 40,
      width: dto.width !== undefined ? Number(dto.width) : 160,
      height: dto.height !== undefined ? Number(dto.height) : 140,
      maxCapacity: dto.maxCapacity !== undefined ? Number(dto.maxCapacity) : 1,
      description: dto.description || '',
      currentResident: null,
      beacons: [],
    };
    if (floor) {
      if (!floor.zones) floor.zones = [];
      floor.zones.push(newZone);
    }
    return newZone;
  }

  async updateZone(id: number, dto: UpdateRoomZoneDto) {
    try {
      const zone = await this.zoneRepo.findOne({ where: { id } });
      if (zone) {
        if (dto.floorId !== undefined) zone.floorId = Number(dto.floorId);
        if (dto.roomNumber !== undefined) zone.roomNumber = dto.roomNumber;
        if (dto.name !== undefined) zone.name = dto.name;
        if (dto.zoneType !== undefined) zone.zoneType = dto.zoneType;
        if (dto.isSafePerimeter !== undefined) zone.isSafePerimeter = dto.isSafePerimeter;
        if (dto.x !== undefined) zone.x = Number(dto.x);
        if (dto.y !== undefined) zone.y = Number(dto.y);
        if (dto.width !== undefined) zone.width = Number(dto.width);
        if (dto.height !== undefined) zone.height = Number(dto.height);
        if (dto.maxCapacity !== undefined) zone.maxCapacity = Number(dto.maxCapacity);
        if (dto.description !== undefined) zone.description = dto.description;
        return await this.zoneRepo.save(zone);
      }
    } catch (err) {
      console.warn('Zone DB update failed, updating fallback:', err?.message);
    }
    this.initFallbackDataIfNeeded();
    for (const f of this.fallbackFloors) {
      const z = f.zones.find((zone: any) => zone.id === id);
      if (z) {
        if (dto.floorId !== undefined) z.floorId = Number(dto.floorId);
        if (dto.roomNumber !== undefined) z.roomNumber = dto.roomNumber;
        if (dto.name !== undefined) z.name = dto.name;
        if (dto.zoneType !== undefined) z.zoneType = dto.zoneType;
        if (dto.isSafePerimeter !== undefined) z.isSafePerimeter = dto.isSafePerimeter;
        if (dto.x !== undefined) z.x = Number(dto.x);
        if (dto.y !== undefined) z.y = Number(dto.y);
        if (dto.width !== undefined) z.width = Number(dto.width);
        if (dto.height !== undefined) z.height = Number(dto.height);
        if (dto.maxCapacity !== undefined) z.maxCapacity = Number(dto.maxCapacity);
        if (dto.description !== undefined) z.description = dto.description;
        return z;
      }
    }
    throw new NotFoundException(`Room Zone #${id} not found`);
  }

  async deleteZone(id: number) {
    try {
      await this.zoneRepo.delete(id);
    } catch (err) {
      console.warn('Zone DB delete failed, removing from fallback:', err?.message);
    }
    this.initFallbackDataIfNeeded();
    for (const f of this.fallbackFloors) {
      f.zones = f.zones.filter((zone: any) => zone.id !== id);
    }
    return { success: true, message: `Room Zone #${id} deleted successfully` };
  }

  // ==========================================
  // Beacons Management CRUD & Fleet Metrics
  // ==========================================
  async getBeacons() {
    try {
      await this.ensureFacilitySeeded();
      const beacons = await this.beaconRepo
        .createQueryBuilder('beacon')
        .leftJoinAndSelect('beacon.zone', 'zone')
        .leftJoinAndSelect('zone.floor', 'floor')
        .orderBy('beacon.id', 'ASC')
        .getMany();

      if (beacons && beacons.length > 0) return beacons;
    } catch (err) {
      console.warn('Beacons DB read failed, using fallback:', err?.message);
    }

    return this.getFallbackBeacons();
  }

  async getBeaconCounters() {
    const beacons = await this.getBeacons();
    const total = beacons.length;
    const active = beacons.filter((b: any) => b.status === 'active').length;
    const lowBattery = beacons.filter((b: any) => Number(b.batteryLevel) < 20).length;
    const unassigned = beacons.filter((b: any) => !b.zoneId && !b.zone).length;
    return { total, active, lowBattery, unassigned };
  }

  async getBeaconById(id: number) {
    try {
      const beacon = await this.beaconRepo
        .createQueryBuilder('beacon')
        .leftJoinAndSelect('beacon.zone', 'zone')
        .leftJoinAndSelect('zone.floor', 'floor')
        .where('beacon.id = :id', { id })
        .getOne();
      if (beacon) return beacon;
    } catch (err) {
      console.warn('Beacon DB find failed, checking fallback:', err?.message);
    }
    this.initFallbackDataIfNeeded();
    const b = this.fallbackBeacons.find((item: any) => item.id === id);
    if (!b) throw new NotFoundException(`Beacon #${id} not found`);
    return b;
  }

  async createBeacon(dto: CreateBeaconDto) {
    try {
      const beacon = this.beaconRepo.create({
        serialNumber: dto.serialNumber,
        macAddress: dto.macAddress,
        model: dto.model || 'Sentinel BLE Anchor v2',
        zoneId: dto.zoneId ? Number(dto.zoneId) : null,
        major: dto.major ? Number(dto.major) : 1000,
        minor: dto.minor ? Number(dto.minor) : 2000,
        rssiCalibrated1m: dto.rssiCalibrated1m ? Number(dto.rssiCalibrated1m) : -59,
        batteryLevel: dto.batteryLevel ? Number(dto.batteryLevel) : 98.5,
        status: dto.status || 'active',
        txIntervalHz: dto.txIntervalHz ? Number(dto.txIntervalHz) : 5,
        lastHeartbeatAt: new Date(),
      });
      const saved = await this.beaconRepo.save(beacon);
      if (saved) return saved;
    } catch (err) {
      console.warn('Beacon DB create failed, saving to fallback:', err?.message);
    }
    this.initFallbackDataIfNeeded();
    const newId =
      this.fallbackBeacons.length > 0
        ? Math.max(...this.fallbackBeacons.map((b: any) => b.id)) + 1
        : 1;

    let attachedZone: any = null;
    if (dto.zoneId) {
      for (const f of this.fallbackFloors) {
        const found = f.zones.find((z: any) => z.id === Number(dto.zoneId));
        if (found) {
          attachedZone = {
            id: found.id,
            roomNumber: found.roomNumber,
            name: found.name,
            floor: { floorNumber: f.floorNumber, name: f.name },
          };
          if (!found.beacons) found.beacons = [];
          found.beacons.push({
            id: newId,
            serialNumber: dto.serialNumber,
            batteryLevel: dto.batteryLevel ? Number(dto.batteryLevel) : 98.5,
          });
          break;
        }
      }
    }

    const newBeacon = {
      id: newId,
      serialNumber: dto.serialNumber,
      macAddress: dto.macAddress,
      model: dto.model || 'Sentinel BLE Anchor v2',
      zoneId: dto.zoneId ? Number(dto.zoneId) : null,
      zone: attachedZone,
      batteryLevel: dto.batteryLevel ? Number(dto.batteryLevel) : 98.5,
      status: dto.status || 'active',
      rssiCalibrated1m: dto.rssiCalibrated1m ? Number(dto.rssiCalibrated1m) : -59,
      txIntervalHz: dto.txIntervalHz ? Number(dto.txIntervalHz) : 5,
      lastHeartbeatAt: new Date(),
    };
    this.fallbackBeacons.push(newBeacon);
    return newBeacon;
  }

  async updateBeacon(id: number, dto: UpdateBeaconDto) {
    try {
      const beacon = await this.beaconRepo.findOne({ where: { id } });
      if (beacon) {
        if (dto.serialNumber !== undefined) beacon.serialNumber = dto.serialNumber;
        if (dto.macAddress !== undefined) beacon.macAddress = dto.macAddress;
        if (dto.model !== undefined) beacon.model = dto.model;
        if (dto.zoneId !== undefined) beacon.zoneId = dto.zoneId ? Number(dto.zoneId) : null;
        if (dto.major !== undefined) beacon.major = Number(dto.major);
        if (dto.minor !== undefined) beacon.minor = Number(dto.minor);
        if (dto.rssiCalibrated1m !== undefined) beacon.rssiCalibrated1m = Number(dto.rssiCalibrated1m);
        if (dto.batteryLevel !== undefined) beacon.batteryLevel = Number(dto.batteryLevel);
        if (dto.status !== undefined) beacon.status = dto.status;
        if (dto.txIntervalHz !== undefined) beacon.txIntervalHz = Number(dto.txIntervalHz);
        return await this.beaconRepo.save(beacon);
      }
    } catch (err) {
      console.warn('Beacon DB update failed, updating fallback:', err?.message);
    }
    this.initFallbackDataIfNeeded();
    const b = this.fallbackBeacons.find((item: any) => item.id === id);
    if (!b) throw new NotFoundException(`Beacon #${id} not found`);

    if (dto.serialNumber !== undefined) b.serialNumber = dto.serialNumber;
    if (dto.macAddress !== undefined) b.macAddress = dto.macAddress;
    if (dto.model !== undefined) b.model = dto.model;
    if (dto.status !== undefined) b.status = dto.status;
    if (dto.batteryLevel !== undefined) b.batteryLevel = Number(dto.batteryLevel);
    if (dto.rssiCalibrated1m !== undefined) b.rssiCalibrated1m = Number(dto.rssiCalibrated1m);
    if (dto.txIntervalHz !== undefined) b.txIntervalHz = Number(dto.txIntervalHz);

    if (dto.zoneId !== undefined) {
      if (dto.zoneId === null) {
        b.zone = null;
        b.zoneId = null;
      } else {
        const targetId = Number(dto.zoneId);
        for (const f of this.fallbackFloors) {
          const found = f.zones.find((z: any) => z.id === targetId);
          if (found) {
            b.zone = {
              id: found.id,
              roomNumber: found.roomNumber,
              name: found.name,
              floor: { floorNumber: f.floorNumber, name: f.name },
            };
            b.zoneId = found.id;
            break;
          }
        }
      }
    }
    return b;
  }

  async assignBeacon(id: number, zoneId: number | null) {
    return this.updateBeacon(id, { zoneId });
  }

  async deleteBeacon(id: number) {
    try {
      await this.beaconRepo.delete(id);
    } catch (err) {
      console.warn('Beacon DB delete failed, removing from fallback:', err?.message);
    }
    this.initFallbackDataIfNeeded();
    this.fallbackBeacons = this.fallbackBeacons.filter((b: any) => b.id !== id);
    return { success: true, message: `Beacon #${id} deleted successfully` };
  }

  async simulateMovement(residentId: number, targetZoneId: number) {
    try {
      const resident = await this.residentRepo.findOne({ where: { id: residentId } });
      const targetZone = await this.zoneRepo
        .createQueryBuilder('zone')
        .leftJoinAndSelect('zone.floor', 'floor')
        .leftJoinAndSelect('zone.beacons', 'beacon')
        .where('zone.id = :id', { id: targetZoneId })
        .getOne();

      if (resident && targetZone) {
        await this.zoneRepo.update({ currentResidentId: residentId }, { currentResidentId: null });
        targetZone.currentResidentId = residentId;
        await this.zoneRepo.save(targetZone);

        // Auto-create a Notification record for the simulated movement / geofence event
        try {
          const isBreach = !targetZone.isSafePerimeter;
          const residentName = `${resident.firstName} ${resident.lastName}`.trim();
          const priority = isBreach ? NotificationPriority.HIGH : NotificationPriority.MEDIUM;
          const title = isBreach
            ? 'Geofence Boundary Breach Warning'
            : 'Resident Spatial Relocation';
          const message = isBreach
            ? `🚨 GEOFENCE ALERT: ${residentName} entered restricted zone ${targetZone.name} (Room ${targetZone.roomNumber || 'Boundary'}). Restricted egress perimeter breach detected.`
            : `${residentName} relocated to ${targetZone.name} (Room ${targetZone.roomNumber || 'Safe Area'}). Within safe perimeter.`;

          const notification = this.notificationRepo.create({
            residentId: resident.id,
            type: NotificationType.GEOFENCE,
            priority,
            title,
            message,
            data: {
              roomNumber: targetZone.roomNumber || undefined,
              zoneId: targetZone.id,
              zoneName: targetZone.name,
              floorNumber: targetZone.floor?.floorNumber || targetZone.floorId,
              isSafePerimeter: targetZone.isSafePerimeter,
              alertTriggered: isBreach,
            },
            isRead: false,
            isDismissed: false,
          });
          await this.notificationRepo.save(notification);
        } catch (notifErr) {
          console.error('Failed to auto-create notification for movement event', notifErr);
        }

        return {
          success: true,
          resident: `${resident.firstName} ${resident.lastName}`,
          newLocation: targetZone.name,
          roomNumber: targetZone.roomNumber,
          floor: targetZone.floor?.name || `Floor ${targetZone.floorId}`,
          isSafePerimeter: targetZone.isSafePerimeter,
          alertTriggered: !targetZone.isSafePerimeter,
          message: targetZone.isSafePerimeter
            ? `Resident moved to ${targetZone.name} (Within Safe Perimeter)`
            : `🚨 GEOFENCE ALERT: Resident entered ${targetZone.name} (Restricted Egress Zone!)`,
        };
      }
    } catch (err) {
      console.warn('Simulate movement DB write failed, updating fallback:', err?.message);
    }

    const fallbackResult = this.simulateFallbackMovement(residentId, targetZoneId);

    // Auto-create notification in fallback mode if DB write failed
    try {
      const isBreach = fallbackResult.alertTriggered;
      const priority = isBreach ? NotificationPriority.HIGH : NotificationPriority.MEDIUM;
      const title = isBreach
        ? 'Geofence Boundary Breach Warning'
        : 'Resident Spatial Relocation';
      const notification = this.notificationRepo.create({
        residentId,
        type: NotificationType.GEOFENCE,
        priority,
        title,
        message: fallbackResult.message,
        data: {
          roomNumber: fallbackResult.roomNumber,
          zoneName: fallbackResult.newLocation,
          isSafePerimeter: fallbackResult.isSafePerimeter,
          alertTriggered: isBreach,
        },
        isRead: false,
        isDismissed: false,
      });
      await this.notificationRepo.save(notification);
    } catch {
      // ignore
    }

    return fallbackResult;
  }

  // ==========================================
  // In-Memory Fallback Topology State
  // ==========================================
  private fallbackMemoryMap: Record<number, number> = {
    1: 106, // Alex Rivera in Sensory Garden
    2: 204, // Eleanor Vance in Suite 204
    3: 209, // Marcus Chen in Corridor 4B (Pacing)
    4: 103, // Clara Oswald in Community Lounge
  };

  private fallbackFloors: any[] | null = null;
  private fallbackBeacons: any[] | null = null;

  private initFallbackDataIfNeeded() {
    if (!this.fallbackFloors) {
      this.fallbackFloors = this.buildInitialFallbackFloors();
    }
    if (!this.fallbackBeacons) {
      this.fallbackBeacons = this.buildInitialFallbackBeacons();
    }
  }

  private getFallbackFloors() {
    this.initFallbackDataIfNeeded();
    return this.fallbackFloors!;
  }

  private buildInitialFallbackFloors() {
    return [
      {
        id: 1,
        floorNumber: 1,
        name: 'Ground Floor & Sensory Garden',
        code: 'FL-01',
        description: 'Community living, therapeutic sensory garden, dining hall, and reception.',
        layoutWidth: 1000,
        layoutHeight: 600,
        isActive: true,
        zones: [
          { id: 101, floorId: 1, roomNumber: '101', name: 'Welcome Foyer & Reception', zoneType: 'common', isSafePerimeter: true, x: 40, y: 40, width: 200, height: 160, currentResident: null, beacons: [{ id: 1, serialNumber: 'BCN-FL1-101', batteryLevel: 99.0 }] },
          { id: 102, floorId: 1, roomNumber: '102', name: 'Central Dining & Nutrition Hall', zoneType: 'dining', isSafePerimeter: true, x: 260, y: 40, width: 340, height: 240, currentResident: null, beacons: [{ id: 2, serialNumber: 'BCN-FL1-102', batteryLevel: 98.5 }] },
          { id: 103, floorId: 1, roomNumber: '103', name: 'Community Lounge & Music Room', zoneType: 'common', isSafePerimeter: true, x: 620, y: 40, width: 340, height: 240, currentResident: this.fallbackMemoryMap[4] === 103 ? { id: 4, firstName: 'Clara', lastName: 'Oswald', uhid: 'RES-004', age: 74 } : null, beacons: [{ id: 3, serialNumber: 'BCN-FL1-103', batteryLevel: 97.2 }] },
          { id: 104, floorId: 1, roomNumber: '104', name: 'Ground Security & Dispatch Post', zoneType: 'staff', isSafePerimeter: true, x: 40, y: 220, width: 200, height: 160, currentResident: null, beacons: [{ id: 4, serialNumber: 'BCN-FL1-104', batteryLevel: 100.0 }] },
          { id: 105, floorId: 1, roomNumber: '105', name: 'Garden Promenade Corridor', zoneType: 'corridor', isSafePerimeter: true, x: 260, y: 300, width: 700, height: 80, currentResident: null, beacons: [{ id: 5, serialNumber: 'BCN-FL1-105', batteryLevel: 96.0 }] },
          { id: 106, floorId: 1, roomNumber: '106', name: 'Therapeutic Sensory Garden & Patio', zoneType: 'garden', isSafePerimeter: true, x: 40, y: 400, width: 560, height: 160, currentResident: this.fallbackMemoryMap[1] === 106 ? { id: 1, firstName: 'Alex', lastName: 'Rivera', uhid: 'RES-001', age: 72 } : null, beacons: [{ id: 6, serialNumber: 'BCN-FL1-106', batteryLevel: 98.4 }] },
          { id: 107, floorId: 1, roomNumber: '107', name: 'Physiotherapy & Cadence Studio', zoneType: 'therapy', isSafePerimeter: true, x: 620, y: 400, width: 220, height: 160, currentResident: null, beacons: [{ id: 7, serialNumber: 'BCN-FL1-107', batteryLevel: 97.8 }] },
          { id: 108, floorId: 1, roomNumber: '108', name: 'Exterior Main Gate (Restricted)', zoneType: 'restricted', isSafePerimeter: false, x: 860, y: 400, width: 100, height: 160, currentResident: null, beacons: [{ id: 8, serialNumber: 'BCN-FL1-108', batteryLevel: 99.5 }] },
        ],
      },
      {
        id: 2,
        floorNumber: 2,
        name: 'Floor 2: Memory Care Suites & Telemetry Desk',
        code: 'FL-02',
        description: 'Private memory care suites 201–212, central telemetry station, and sensory calming lounge.',
        layoutWidth: 1000,
        layoutHeight: 600,
        isActive: true,
        zones: [
          { id: 201, floorId: 2, roomNumber: '201', name: 'Suite 201 (Private Room)', zoneType: 'suite', isSafePerimeter: true, x: 40, y: 40, width: 160, height: 160, currentResident: this.fallbackMemoryMap[1] === 201 ? { id: 1, firstName: 'Alex', lastName: 'Rivera', uhid: 'RES-001', age: 72 } : null, beacons: [{ id: 9, serialNumber: 'BCN-FL2-201', batteryLevel: 98.0 }] },
          { id: 202, floorId: 2, roomNumber: '202', name: 'Suite 202 (Private Room)', zoneType: 'suite', isSafePerimeter: true, x: 220, y: 40, width: 160, height: 160, currentResident: null, beacons: [{ id: 10, serialNumber: 'BCN-FL2-202', batteryLevel: 97.5 }] },
          { id: 203, floorId: 2, roomNumber: '203', name: 'Suite 203 (Private Room)', zoneType: 'suite', isSafePerimeter: true, x: 400, y: 40, width: 160, height: 160, currentResident: null, beacons: [{ id: 11, serialNumber: 'BCN-FL2-203', batteryLevel: 99.0 }] },
          { id: 204, floorId: 2, roomNumber: '204', name: 'Suite 204 (Eleanor Vance - En-Suite)', zoneType: 'suite', isSafePerimeter: true, x: 580, y: 40, width: 180, height: 160, currentResident: this.fallbackMemoryMap[2] === 204 ? { id: 2, firstName: 'Eleanor', lastName: 'Vance', uhid: 'RES-002', age: 78 } : null, beacons: [{ id: 12, serialNumber: 'BCN-FL2-204', batteryLevel: 98.2 }] },
          { id: 205, floorId: 2, roomNumber: '205', name: 'Suite 205 (Private Room)', zoneType: 'suite', isSafePerimeter: true, x: 780, y: 40, width: 180, height: 160, currentResident: null, beacons: [{ id: 13, serialNumber: 'BCN-FL2-205', batteryLevel: 96.8 }] },
          { id: 200, floorId: 2, roomNumber: '200A', name: 'North Memory Corridor Gallery', zoneType: 'corridor', isSafePerimeter: true, x: 40, y: 220, width: 920, height: 70, currentResident: null, beacons: [{ id: 14, serialNumber: 'BCN-FL2-200A', batteryLevel: 98.0 }] },
          { id: 299, floorId: 2, roomNumber: '200B', name: 'Central Acute Telemetry Desk', zoneType: 'staff', isSafePerimeter: true, x: 360, y: 310, width: 280, height: 140, currentResident: null, beacons: [{ id: 15, serialNumber: 'BCN-FL2-200B', batteryLevel: 100.0 }] },
          { id: 206, floorId: 2, roomNumber: '206', name: 'Snoezelen Sensory Calming Lounge', zoneType: 'calming', isSafePerimeter: true, x: 40, y: 310, width: 160, height: 140, currentResident: null, beacons: [{ id: 16, serialNumber: 'BCN-FL2-206', batteryLevel: 98.5 }] },
          { id: 207, floorId: 2, roomNumber: '207', name: 'Suite 207 (Private Room)', zoneType: 'suite', isSafePerimeter: true, x: 220, y: 310, width: 120, height: 140, currentResident: null, beacons: [{ id: 17, serialNumber: 'BCN-FL2-207', batteryLevel: 97.0 }] },
          { id: 208, floorId: 2, roomNumber: '208', name: 'Suite 208 (Lewy Body Suite)', zoneType: 'suite', isSafePerimeter: true, x: 660, y: 310, width: 140, height: 140, currentResident: null, beacons: [{ id: 18, serialNumber: 'BCN-FL2-208', batteryLevel: 98.5 }] },
          { id: 209, floorId: 2, roomNumber: '209', name: 'Corridor 4B (Pacing Zone)', zoneType: 'corridor', isSafePerimeter: true, x: 820, y: 310, width: 140, height: 140, currentResident: this.fallbackMemoryMap[3] === 209 ? { id: 3, firstName: 'Marcus', lastName: 'Chen', uhid: 'RES-003', age: 69 } : null, beacons: [{ id: 19, serialNumber: 'BCN-FL2-209', batteryLevel: 96.4 }] },
          { id: 210, floorId: 2, roomNumber: '210', name: 'Suite 210 (Private Room)', zoneType: 'suite', isSafePerimeter: true, x: 40, y: 470, width: 180, height: 100, currentResident: null, beacons: [{ id: 20, serialNumber: 'BCN-FL2-210', batteryLevel: 99.0 }] },
          { id: 211, floorId: 2, roomNumber: '211', name: 'Suite 211 (Private Room)', zoneType: 'suite', isSafePerimeter: true, x: 240, y: 470, width: 180, height: 100, currentResident: null, beacons: [{ id: 21, serialNumber: 'BCN-FL2-211', batteryLevel: 98.0 }] },
          { id: 212, floorId: 2, roomNumber: '212', name: 'Suite 212 (Private Room)', zoneType: 'suite', isSafePerimeter: true, x: 440, y: 470, width: 180, height: 100, currentResident: null, beacons: [{ id: 22, serialNumber: 'BCN-FL2-212', batteryLevel: 97.8 }] },
          { id: 213, floorId: 2, roomNumber: '213', name: 'Quiet Reading Alcove', zoneType: 'common', isSafePerimeter: true, x: 640, y: 470, width: 200, height: 100, currentResident: null, beacons: [{ id: 23, serialNumber: 'BCN-FL2-213', batteryLevel: 98.5 }] },
          { id: 214, floorId: 2, roomNumber: '214', name: 'Fire Stairwell B (Restricted Egress)', zoneType: 'restricted', isSafePerimeter: false, x: 860, y: 470, width: 100, height: 100, currentResident: null, beacons: [{ id: 24, serialNumber: 'BCN-FL2-214', batteryLevel: 100.0 }] },
        ],
      },
    ];
  }

  private buildInitialFallbackBeacons() {
    const floors = this.buildInitialFallbackFloors();
    const bList: any[] = [];
    for (const f of floors) {
      for (const z of f.zones) {
        for (const b of z.beacons) {
          bList.push({
            id: b.id || bList.length + 1,
            serialNumber: b.serialNumber,
            macAddress: `E4:95:6E:0${f.floorNumber}:${z.roomNumber.replace(/[^0-9]/g, '').padStart(2, '0').slice(-2)}:01`,
            model: 'Sentinel BLE Anchor v2',
            zoneId: z.id,
            zone: { id: z.id, roomNumber: z.roomNumber, name: z.name, floor: { id: f.id, floorNumber: f.floorNumber, name: f.name } },
            major: 1000 + f.floorNumber,
            minor: 2000 + (z.id % 1000),
            rssiCalibrated1m: -59,
            batteryLevel: b.batteryLevel,
            status: 'active',
            txIntervalHz: 5,
            lastHeartbeatAt: new Date(),
          });
        }
      }
    }
    return bList;
  }

  private getFallbackPresence() {
    const floors = this.getFallbackFloors();
    const presenceList: any[] = [];

    for (const f of floors) {
      for (const z of f.zones) {
        if (z.currentResident) {
          const posX = z.x + z.width / 2;
          const posY = z.y + z.height / 2;
          const geo = pixelToGeo(posX, posY, f.layoutWidth || 1000, f.layoutHeight || 600);
          presenceList.push({
            residentId: z.currentResident.id,
            uhid: z.currentResident.uhid,
            name: `${z.currentResident.firstName} ${z.currentResident.lastName}`,
            age: z.currentResident.age,
            floorNumber: f.floorNumber,
            floorName: f.name,
            zoneId: z.id,
            roomNumber: z.roomNumber,
            zoneName: z.name,
            zoneType: z.zoneType,
            isSafePerimeter: z.isSafePerimeter,
            x: posX,
            y: posY,
            lat: geo.lat,
            lng: geo.lng,
            beaconId: z.beacons?.[0]?.serialNumber || 'BCN-ACTIVE',
            rssi: -62,
            dwellMinutes: 44,
            status: z.isSafePerimeter ? 'safe' : 'egress_alert',
          });
        }
      }
    }

    return presenceList;
  }

  private getFallbackBeacons() {
    this.initFallbackDataIfNeeded();
    return this.fallbackBeacons!;
  }

  private simulateFallbackMovement(residentId: number, targetZoneId: number) {
    this.fallbackMemoryMap[residentId] = targetZoneId;

    const floors = this.getFallbackFloors();
    let targetZ: any = null;
    let targetF: any = null;

    for (const f of floors) {
      for (const z of f.zones) {
        if (z.id === targetZoneId) {
          targetZ = z;
          targetF = f;
          break;
        }
      }
    }

    const resNames: Record<number, string> = {
      1: 'Alex Rivera',
      2: 'Eleanor Vance',
      3: 'Marcus Chen',
      4: 'Clara Oswald',
    };

    const resName = resNames[residentId] || `Resident #${residentId}`;

    return {
      success: true,
      resident: resName,
      newLocation: targetZ?.name || `Zone #${targetZoneId}`,
      roomNumber: targetZ?.roomNumber || 'Unknown',
      floor: targetF?.name || 'Floor 2',
      isSafePerimeter: targetZ?.isSafePerimeter ?? true,
      alertTriggered: !(targetZ?.isSafePerimeter ?? true),
      message: (targetZ?.isSafePerimeter ?? true)
        ? `${resName} moved to ${targetZ?.name || 'new room'} (Within Safe Perimeter)`
        : `🚨 GEOFENCE ALERT: ${resName} entered ${targetZ?.name || 'restricted exit'} (Restricted Perimeter Breach!)`,
    };
  }
}
