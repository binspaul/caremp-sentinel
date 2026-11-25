import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Version,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FacilityService } from './facility.service';
import { SimulateMovementDto } from './dtos/simulate-movement.dto';
import { CreateFloorDto, UpdateFloorDto } from './dtos/floor.dto';
import { CreateRoomZoneDto, UpdateRoomZoneDto } from './dtos/room-zone.dto';
import { CreateBeaconDto, UpdateBeaconDto, AssignBeaconDto } from './dtos/beacon.dto';

@Controller('facility')
export class FacilityController {
  constructor(private readonly facilityService: FacilityService) {}

  // ==========================================
  // Floors Management
  // ==========================================
  @Version('1')
  @Get('floors')
  async getFloors() {
    const data = await this.facilityService.getFloors();
    return {
      code: 200,
      status: 'success',
      message: 'Facility floors, zones, and resident mappings retrieved successfully',
      data,
    };
  }

  @Version('1')
  @Get('floors/:id')
  async getFloor(@Param('id') id: string) {
    const data = await this.facilityService.getFloorById(Number(id));
    return {
      code: 200,
      status: 'success',
      message: `Floor #${id} retrieved successfully`,
      data,
    };
  }

  @Version('1')
  @Post('floors')
  @HttpCode(HttpStatus.CREATED)
  async createFloor(@Body() body: CreateFloorDto) {
    const data = await this.facilityService.createFloor(body);
    return {
      code: 201,
      status: 'success',
      message: `Floor ${data.name} created successfully`,
      data,
    };
  }

  @Version('1')
  @Put('floors/:id')
  async updateFloor(@Param('id') id: string, @Body() body: UpdateFloorDto) {
    const data = await this.facilityService.updateFloor(Number(id), body);
    return {
      code: 200,
      status: 'success',
      message: `Floor #${id} updated successfully`,
      data,
    };
  }

  @Version('1')
  @Delete('floors/:id')
  async deleteFloor(@Param('id') id: string) {
    const data = await this.facilityService.deleteFloor(Number(id));
    return {
      code: 200,
      status: 'success',
      message: data.message,
      data,
    };
  }

  // ==========================================
  // Room Zones Management
  // ==========================================
  @Version('1')
  @Get('zones')
  async getZones(@Query('floorId') floorId?: string) {
    const data = await this.facilityService.getZones(floorId ? Number(floorId) : undefined);
    return {
      code: 200,
      status: 'success',
      message: 'Room zones retrieved successfully',
      data,
    };
  }

  @Version('1')
  @Get('zones/:id')
  async getZone(@Param('id') id: string) {
    const data = await this.facilityService.getZoneById(Number(id));
    return {
      code: 200,
      status: 'success',
      message: `Room zone #${id} retrieved successfully`,
      data,
    };
  }

  @Version('1')
  @Post('zones')
  @HttpCode(HttpStatus.CREATED)
  async createZone(@Body() body: CreateRoomZoneDto) {
    const data = await this.facilityService.createZone(body);
    return {
      code: 201,
      status: 'success',
      message: `Room zone ${data.name} created successfully`,
      data,
    };
  }

  @Version('1')
  @Put('zones/:id')
  async updateZone(@Param('id') id: string, @Body() body: UpdateRoomZoneDto) {
    const data = await this.facilityService.updateZone(Number(id), body);
    return {
      code: 200,
      status: 'success',
      message: `Room zone #${id} updated successfully`,
      data,
    };
  }

  @Version('1')
  @Delete('zones/:id')
  async deleteZone(@Param('id') id: string) {
    const data = await this.facilityService.deleteZone(Number(id));
    return {
      code: 200,
      status: 'success',
      message: data.message,
      data,
    };
  }

  // ==========================================
  // Beacons Management & Fleet
  // ==========================================
  @Version('1')
  @Get('beacons/counters')
  async getBeaconCounters() {
    const data = await this.facilityService.getBeaconCounters();
    return {
      code: 200,
      status: 'success',
      message: 'BLE beacon hardware fleet counters retrieved',
      data,
    };
  }

  @Version('1')
  @Get('beacons')
  async getBeacons() {
    const data = await this.facilityService.getBeacons();
    return {
      code: 200,
      status: 'success',
      message: 'BLE beacon hardware fleet retrieved',
      data,
    };
  }

  @Version('1')
  @Get('beacons/:id')
  async getBeacon(@Param('id') id: string) {
    const data = await this.facilityService.getBeaconById(Number(id));
    return {
      code: 200,
      status: 'success',
      message: `Beacon #${id} retrieved successfully`,
      data,
    };
  }

  @Version('1')
  @Post('beacons')
  @HttpCode(HttpStatus.CREATED)
  async createBeacon(@Body() body: CreateBeaconDto) {
    const data = await this.facilityService.createBeacon(body);
    return {
      code: 201,
      status: 'success',
      message: `Beacon ${data.serialNumber} registered successfully`,
      data,
    };
  }

  @Version('1')
  @Put('beacons/:id')
  async updateBeacon(@Param('id') id: string, @Body() body: UpdateBeaconDto) {
    const data = await this.facilityService.updateBeacon(Number(id), body);
    return {
      code: 200,
      status: 'success',
      message: `Beacon #${id} updated successfully`,
      data,
    };
  }

  @Version('1')
  @Post('beacons/:id/assign')
  async assignBeacon(@Param('id') id: string, @Body() body: AssignBeaconDto) {
    const data = await this.facilityService.assignBeacon(
      Number(id),
      body.zoneId !== undefined ? (body.zoneId !== null ? Number(body.zoneId) : null) : null,
    );
    return {
      code: 200,
      status: 'success',
      message: `Beacon #${id} assignment updated`,
      data,
    };
  }

  @Version('1')
  @Delete('beacons/:id')
  async deleteBeacon(@Param('id') id: string) {
    const data = await this.facilityService.deleteBeacon(Number(id));
    return {
      code: 200,
      status: 'success',
      message: data.message,
      data,
    };
  }

  // ==========================================
  // Presence & Simulation Telemetry
  // ==========================================
  @Version('1')
  @Get('geojson')
  async getGeoJson(@Query('floorNumber') floorNumber?: string) {
    const data = await this.facilityService.getFloorGeoJson(
      floorNumber ? Number(floorNumber) : undefined,
    );
    return {
      code: 200,
      status: 'success',
      message: 'Facility GeoJSON indoor features retrieved',
      data,
    };
  }

  @Version('1')
  @Get('floors/geojson')
  async getFloorsGeoJson(@Query('floorNumber') floorNumber?: string) {
    const data = await this.facilityService.getFloorGeoJson(
      floorNumber ? Number(floorNumber) : undefined,
    );
    return {
      code: 200,
      status: 'success',
      message: 'Facility GeoJSON indoor features retrieved',
      data,
    };
  }

  @Version('1')
  @Get('presence')
  async getPresence() {
    const data = await this.facilityService.getPresence();
    return {
      code: 200,
      status: 'success',
      message: 'Live resident presence and spatial telemetry retrieved',
      data,
    };
  }

  @Version('1')
  @Post('simulate-movement')
  @HttpCode(HttpStatus.OK)
  async simulateMovement(@Body() body: SimulateMovementDto) {
    const data = await this.facilityService.simulateMovement(
      Number(body.residentId),
      Number(body.targetZoneId),
    );
    return {
      code: 200,
      status: 'success',
      message: 'Resident movement simulated successfully',
      data,
    };
  }
}
